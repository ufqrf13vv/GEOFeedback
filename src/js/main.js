import styles from '../css/style.css';
import html from '../index.hbs';

import Handlebars from 'handlebars/dist/handlebars.min.js';

import { openWindow, clearWindow } from './modules/feedback';

let myMap;
let myPlacemark;
let clusterer;

const feedbackWindow = document.querySelector('#feedback');
const closeFeedbackWindow = feedbackWindow.querySelector('#closeWindow');
const addFeedbackWindow = feedbackWindow.querySelector('#add');
const list = feedbackWindow.querySelector('#list');

const db = openDatabase('Feedbacks', '0.1', 'A list of feedbacks', 200000);

new Promise(resolve => ymaps.ready(resolve))
    .then(resolve => {
        if (!db) {
            alert('Ошибка подключения к БД!');
        }

        db.transaction(tx => {
            tx.executeSql('CREATE TABLE IF NOT EXISTS Feedback (geo_id, name, place, feedback, address, coords, timestamp REAL)');
            //tx.executeSql('DROP TABLE Feedback');
        });
    })
    .then(resolve => {
        let data = {};

        myMap = new ymaps.Map('map', {
            center: [54.99, 73.37],
            zoom: 16,
            behaviors: ['default', 'scrollZoom']
        }, {
            searchControlProvider: 'yandex#search'
        });

        // Балун Карусель
        let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<h3 class="balloon-place">{{ properties.place|raw }}, {{ properties.username|raw }}</h3>' +
            '<a href="#" class="balloon-address" data-x="{{ properties.coordX|raw }}" data-y="{{ properties.coordY|raw }}">{{ properties.address|raw }}</a></br></br>' +
            '<div class="balloon-review">{{ properties.feedback|raw }}</div></br>' +
            '<div class="balloon-date">{{ properties.date|raw }}</div>'
        );

        // Кластеризатор
            clusterer = new ymaps.Clusterer({
            clusterDisableClickZoom: true,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false,
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            clusterBalloonItemContentLayout: customItemContentLayout,
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130,
            clusterBalloonPagerSize: 5
        });

        db.transaction(tx => {
            tx.executeSql('SELECT * FROM Feedback', [], (tx, results) => {
                let marks = [];

                for (let i = 0; i < results.rows.length; i++) {
                    let coords = results.rows.item(i).coords.split(',');

                    marks[i] = new ymaps.Placemark([parseFloat(coords[0]), parseFloat(coords[1])], {
                        place: results.rows.item(i).place,
                        username: results.rows.item(i).name,
                        coordX: coords[0],
                        coordY: coords[1],
                        address: results.rows.item(i).address,
                        feedback: results.rows.item(i).feedback,
                        date: results.rows.item(i).timestamp,
                        preset: "islands#dotCircleIcon",
                        iconColor: '#ff0000'
                    });
                }
                clusterer.add(marks);
                myMap.geoObjects.add(clusterer);
            });
        });

        myMap.events.add('click', event => {
            if (!myMap.balloon.isOpen()) {
                let coords = event.get('coords');
                let clientCoords = event.getSourceEvent().originalEvent.clientPixels;

                ymaps.geocode(coords).then(res => {
                    let address = res.geoObjects.get(0).properties.get('text');
                    let id = res.geoObjects.get(0).properties.get('metaDataProperty').GeocoderMetaData.id;
                    data = {
                        id: id,
                        coords: coords,
                        address: address,
                        clientCoords: {top: clientCoords[1] + 'px', left: clientCoords[0] + 'px'}
                    };
                    openWindow(data, feedbackWindow);
                });
            } else {
                myMap.balloon.close();
            }
        });

        addFeedbackWindow.addEventListener('click', event => {
            let dataList = {};
            let date = '';
            let html = '';

            dataList.name = feedbackWindow.querySelector('#name').value;
            dataList.place = feedbackWindow.querySelector('#place').value;
            dataList.text = feedbackWindow.querySelector('#text').value;

            event.preventDefault();

            //if (!dataList.name) {
            //    feedbackWindow.querySelector('#name').focus();
            //    alert('Введите пожалуйста Ваше имя.');
            //
            //    return;
            //}
            //if (!dataList.place) {
            //    feedbackWindow.querySelector('#place').focus();
            //    alert('Введите пожалуйста место.');
            //
            //    return;
            //}
            //if (!dataList.text) {
            //    feedbackWindow.querySelector('#text').focus();
            //    alert('Введите пожалуйста Ваш отзыв об этом месте.');
            //
            //    return;
            //}

            date = new Date();
            dataList.date = `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`;

            db.transaction(tx => {
                tx.executeSql('INSERT INTO Feedback (geo_id, name, place, feedback, address, coords, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?)',
                    [data.id, dataList.name, dataList.place, dataList.text, data.address, data.coords, dataList.date], null, null);
            });

            let template = `<li class="feedback__item">
                                <div class="feedback__item-header">
                                    <div class="feedback__item-name">{{name}}</div>
                                    <div class="feedback__item-place">{{place}}</div>
                                    <div class="feedback__item-date">{{date}}</div>
                                </div>
                                <div class="feedback__item-text">{{text}}</div>
                            </li>`;
            let render = Handlebars.compile(template);

            html = render(dataList);

            if (!list.childNodes.length) {
                list.previousElementSibling.style.display = 'none';
            }

            list.insertAdjacentHTML('beforeEnd', html);

            myPlacemark = createPlacemark(data.coords);
            myMap.geoObjects.add(myPlacemark);

            clearWindow(feedbackWindow);
            feedbackWindow.querySelector('#name').focus();
        });

        closeFeedbackWindow.addEventListener('click', event => {
            event.preventDefault();

            feedbackWindow.style.display = 'none';
            clearWindow(feedbackWindow);
        });

        function createPlacemark(coords) {
            let placemark = new ymaps.Placemark(coords, {
                coordX: coords[0],
                coordY: coords[1],
                place: 'place',
                username: 'user',
                address: 'address',
                feedback: 'feedback',
                date: '01.01.2017 12:44'
            });

            placemark.events.add('click', function () {
                openWindow(data, feedbackWindow);
            });

            clusterer.add(placemark);
        }
    })
    .catch(error => alert('Ошибка: ' + error.message));