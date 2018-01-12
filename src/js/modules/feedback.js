export function openWindow(data, window) {
    let address = window.querySelector('.feedback__header-address');

    window.style.display = 'block';
    window.style.left = data.clientCoords[0];
    window.style.top = data.clientCoords[1];
    address.innerHTML = data.address;
    address.dataset.id = data.id;
    address.dataset.coords = data.coords;
    address.dataset.address = data.address;
}

export function clearWindow(window) {
    window.querySelector('#name').value = '';
    window.querySelector('#place').value = '';
    window.querySelector('#text').value = '';
    window.querySelector('.feedback__empty').style.display = 'block';
    window.querySelector('#list').innerHTML = '';
}