/// <reference types="chrome"/>

// Background Service Worker
console.log('Prompt Template: Background service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Template: Extension installed');
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});