import Handlebars from 'handlebars/dist/handlebars.min.js';

export default function render(list, data) {
    let template = `<li class="feedback__item">
                                <div class="feedback__item-header">
                                    <div class="feedback__item-name">{{name}}</div>
                                    <div class="feedback__item-place">{{place}}</div>
                                    <div class="feedback__item-date">{{date}}</div>
                                </div>
                                <div class="feedback__item-text">{{text}}</div>
                            </li>`;
    let render = Handlebars.compile(template);
    let html = render(data);

    if (!list.childNodes.length) {
        list.previousElementSibling.style.display = 'none';
    }

    list.insertAdjacentHTML('beforeEnd', html);
}