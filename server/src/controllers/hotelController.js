const RAPIDAPI_HOST = 'tripadvisor16.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '7db4e8621bmshe0271626cbdd145p1c4f7ejsn1f676ee4671c';

export const searchHotels = async (req, res) => {
  try {
    const { query, checkIn, checkOut, adults = 2, rooms = 1 } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query (location) is required' });
    }

    // Step 1: Search Location to get geoId
    const locationOptions = {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    };

    const locResponse = await fetch(`https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=${encodeURIComponent(query)}`, locationOptions);
    const locData = await locResponse.json();

    if (!locData || !locData.data || locData.data.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Find the first location that has a geoId
    const geoId = locData.data.find(item => item.geoId)?.geoId;

    if (!geoId) {
      return res.status(404).json({ message: 'No viable geoId found for this location' });
    }

    // Step 2: Search Hotels with the geoId
    // Base URL
    let url = `https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${geoId}&adults=${adults}&rooms=${rooms}`;
    
    // Append optional params
    if (checkIn && checkOut) {
      url += `&checkIn=${checkIn}&checkOut=${checkOut}`;
    }

    const hotelResponse = await fetch(url, locationOptions);
    const hotelData = await hotelResponse.json();

    if (!hotelData || !hotelData.status || !hotelData.data || !hotelData.data.data) {
      return res.status(500).json({ message: 'Failed to fetch hotels from TripAdvisor' });
    }

    // Return the response formatted as requested
    res.json({
      status: true,
      data: {
        data: hotelData.data.data
      }
    });

  } catch (error) {
    console.error('Search hotels error:', error);
    res.status(500).json({ message: 'Internal server error while searching hotels' });
  }
};
