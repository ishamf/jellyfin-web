import { playbackManager } from './playbackmanager';
import dom from '../../scripts/dom';
import browser from '../../scripts/browser';
import Events from '../../utils/events.ts';

import './iconosd.scss';
import 'material-design-icons-iconfont';

let currentPlayer;
let osdElement;
let textElement;

let enableAnimation;

function getOsdElementHtml() {
    let html = '';

    html += '<span class="material-icons iconOsdIcon speed" aria-hidden="true"></span>';

    html += '<div class="iconOsdText"></div>';

    return html;
}

function ensureOsdElement() {
    let elem = osdElement;
    if (!elem) {
        enableAnimation = browser.supportsCssAnimation();

        elem = document.createElement('div');
        elem.classList.add('hide');
        elem.classList.add('iconOsd');
        elem.classList.add('iconOsd-hidden');
        elem.classList.add('playbackSpeedOsd');
        elem.innerHTML = getOsdElementHtml();

        textElement = elem.querySelector('.iconOsdText');

        document.body.appendChild(elem);
        osdElement = elem;
    }
}

function onHideComplete() {
    this.classList.add('hide');
}

let hideTimeout;
function showOsd() {
    clearHideTimeout();

    const elem = osdElement;

    dom.removeEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
        once: true
    });

    elem.classList.remove('hide');

    // trigger reflow
    void elem.offsetWidth;

    requestAnimationFrame(function () {
        elem.classList.remove('iconOsd-hidden');

        hideTimeout = setTimeout(hideOsd, 1000);
    });
}

function clearHideTimeout() {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

function hideOsd() {
    clearHideTimeout();

    const elem = osdElement;
    if (elem) {
        if (enableAnimation) {
            // trigger reflow
            void elem.offsetWidth;

            requestAnimationFrame(function () {
                elem.classList.add('iconOsd-hidden');

                dom.addEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
                    once: true
                });
            });
        } else {
            onHideComplete.call(elem);
        }
    }
}

function updatePlayerPlaybackSpeedState(speed) {
    if (textElement) {
        textElement.textContent = speed.toFixed(2) + 'x';
    }
}

function releaseCurrentPlayer() {
    const player = currentPlayer;

    if (player) {
        Events.off(player, 'playbackratechange', onPlaybackRateChanged);
        Events.off(player, 'playbackstop', hideOsd);
        currentPlayer = null;
    }
}

function onPlaybackRateChanged() {
    const player = this;

    ensureOsdElement();

    updatePlayerPlaybackSpeedState(player.getPlaybackRate());

    showOsd();
}

function bindToPlayer(player) {
    if (player === currentPlayer) {
        return;
    }

    releaseCurrentPlayer();

    currentPlayer = player;

    if (!player) {
        return;
    }

    hideOsd();
    Events.on(player, 'playbackratechange', onPlaybackRateChanged);
    Events.on(player, 'playbackstop', hideOsd);
}

Events.on(playbackManager, 'playerchange', function () {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());
