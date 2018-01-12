import styles from '../css/style.css';
import html from '../index.hbs';

import { openWindow, clearWindow } from './modules/feedback';
import render from './modules/render';
import createPlacemark from './modules/placemark';

let myMap, clusterer;

const map = document.querySelector('#map');
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
            tx.executeSql('CREATE TABLE IF NOT EXISTS Feedback (id, name, place, feedback, address, coords, timestamp REAL)');
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

        // Макет карусели
        let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<h3 class="balloon-place">{{ properties.place|raw }}, {{ properties.username|raw }}</h3>' +
            '<a href="#" class="balloon-address" data-id="{{ properties.id|raw }}">{{ properties.address|raw }}</a></br></br>' +
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

        // Вывод всех сохраненных меток
        db.transaction(tx => {
            tx.executeSql('SELECT * FROM Feedback', [], (tx, results) => {
                let marks = [];

                for (let i = 0; i < results.rows.length; i++) {
                    marks[i] = createPlacemark(results.rows.item(i));
                }

                clusterer.add(marks);
                myMap.geoObjects.add(clusterer);
            });
        });

        // Клик по карте
        myMap.events.add('click', event => {
            clearWindow(feedbackWindow);

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
                        clientCoords: [clientCoords[0] + 'px', clientCoords[1] + 'px']
                    };
                    openWindow(data, feedbackWindow);
                });
            } else {
                myMap.balloon.close();
            }
        });

        // Добавление отзыва
        addFeedbackWindow.addEventListener('click', event => {
            let dataList = {};
            let date = '';
            let mark = '';
            let headerAddress = feedbackWindow.querySelector('.feedback__header-address');

            event.preventDefault();

            dataList.name = feedbackWindow.querySelector('#name').value;
            dataList.place = feedbackWindow.querySelector('#place').value;
            dataList.text = feedbackWindow.querySelector('#text').value;

            if (!dataList.name) {
                feedbackWindow.querySelector('#name').focus();
                alert('Введите пожалуйста Ваше имя.');

                return;
            }
            if (!dataList.place) {
                feedbackWindow.querySelector('#place').focus();
                alert('Введите пожалуйста место.');

                return;
            }
            if (!dataList.text) {
                feedbackWindow.querySelector('#text').focus();
                alert('Введите пожалуйста Ваш отзыв об этом месте.');

                return;
            }

            date = new Date();
            dataList.date = `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`;

            dataList.id = headerAddress.dataset.id;
            dataList.coords = headerAddress.dataset.coords;
            dataList.address = headerAddress.dataset.address;

            db.transaction(tx => {
                tx.executeSql('INSERT INTO Feedback (id, name, place, feedback, address, coords, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?)',
                    [dataList.id, dataList.name, dataList.place, dataList.text, dataList.address, dataList.coords, dataList.date], null, null);
            });

            render(list, dataList);

            mark = createPlacemark(dataList);
            clusterer.add(mark);
            myMap.geoObjects.add(clusterer);

            feedbackWindow.querySelector('#name').focus();
        });

        // Закрытие окна
        closeFeedbackWindow.addEventListener('click', event => {
            event.preventDefault();

            feedbackWindow.style.display = 'none';
            clearWindow(feedbackWindow);
        });

        // Клик по адресу
        map.addEventListener('click', (event) => {
            event.preventDefault();

            if (event.target.className == 'balloon-address') {
                let id = event.target.dataset.id;

                db.transaction(tx => {
                    tx.executeSql(`SELECT * FROM Feedback WHERE id = '${id}'`, [], (tx, results) => {
                        for (let i = 0; i < results.rows.length; i++) {
                            render(list, results.rows.item(i));
                        }

                        myMap.balloon.close();
                        openWindow({
                            address: results.rows.item(0).address,
                            clientCoords: [event.clientX + 'px', event.clientY + 'px'],
                            id: id,
                            coords: results.rows.item(0).coords
                        }, feedbackWindow);
                    });
                });
            }
        });

        // Клик по одиночной метке
        myMap.geoObjects.events.add('click', event => {
            let target = event.get('target');

            if (target.options.getName() == 'geoObject') {
                let id = target.properties._data.id;

                return new Promise(resolve => {
                    db.transaction(tx => {
                        tx.executeSql(`SELECT * FROM Feedback WHERE id = '${id}'`, [], (tx, results) => {
                            render(list, results.rows.item(0));
                            target.properties._data.clientCoords = [event.get('clientX') + 'px', event.get('clientY') + 'px'];
                            resolve(target.properties._data.coords = results.rows.item(0).coords);
                        });
                    });
                })
                    .then(
                        result => openWindow(target.properties._data, feedbackWindow)
                    );
            }
        });
    })
    .catch(error => alert('Ошибка: ' + error.message));