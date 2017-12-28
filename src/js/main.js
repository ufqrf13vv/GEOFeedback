import styles from '../css/style.css';
import html from '../index.html';

let myMap;
let clusterer;

new Promise(resolve => ymaps.ready(resolve))
    .then(friends => {
        myMap = new ymaps.Map('map', {
            center: [54.99, 73.37],
            zoom: 7
        }, {
            searchControlProvider: 'yandex#search'
        });
        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedVioletClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: false
        });

        myMap.geoObjects.add(clusterer);
    })
    .catch(error => alert('Ошибка: ' + error.message));