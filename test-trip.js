async function test() {
  const RAPIDAPI_HOST = 'tripadvisor16.p.rapidapi.com';
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '7db4e8621bmshe0271626cbdd145p1c4f7ejsn1f676ee4671c';
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-host': RAPIDAPI_HOST,
      'x-rapidapi-key': RAPIDAPI_KEY
    }
  };

  try {
    const locRes = await fetch("https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchLocation?query=Hyderabad", options);
    const locData = await locRes.json();
    console.log("LocData:", JSON.stringify(locData, null, 2));

    const geoId = locData.data && Array.isArray(locData.data) 
      ? locData.data.find(i => i.geoId)?.geoId 
      : locData.data?.data?.find(i => i.geoId)?.geoId;
      
    console.log("Found GEOID:", geoId);

    const checkIn = "2026-04-01";
    const checkOut = "2026-04-02";
    const hotelRes = await fetch(`https://tripadvisor16.p.rapidapi.com/api/v1/hotels/searchHotels?geoId=${geoId}&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&rooms=1`, options);
    const hotelData = await hotelRes.json();
    console.log("HotelData Keys:", Object.keys(hotelData));
    console.log("HotelData.data keys:", hotelData.data ? Object.keys(hotelData.data) : 'N/A');
    if (hotelData.data && hotelData.data.data) {
        console.log("Number of hotels:", hotelData.data.data.length);
    }
  } catch(e) {
    console.error(e);
  }
}
test();
