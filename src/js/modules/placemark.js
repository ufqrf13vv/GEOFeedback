export default function createPlacemark(data) {
    let coords = data.coords.split(',');

    return new ymaps.Placemark([parseFloat(coords[0]), parseFloat(coords[1])], {
        id: data.id,
        place: data.place,
        username: data.name,
        address: data.address,
        feedback: data.text,
        date: data.date
    });
}