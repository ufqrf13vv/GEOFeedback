export function openWindow(data, window) {
    let address = window.querySelector('.feedback__header-address');

    window.style.display = 'block';
    window.style.left = data.clientCoords.left;
    window.style.top = data.clientCoords.top;
    address.innerHTML = data.address;

    //console.log(address);
}

export function clearWindow(window) {
    window.querySelector('#name').value = '';
    window.querySelector('#place').value = '';
    window.querySelector('#text').value = '';
    window.querySelector('.feedback__empty').style.display = 'block';
    window.querySelector('#list').innerHTML = '';
}