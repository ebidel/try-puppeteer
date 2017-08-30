const Downloader = require('puppeteer/utils/ChromiumDownloader');
const chromiumRevision = require('puppeteer/package.json').puppeteer.chromium_revision;

const revisionInfo = Downloader.revisionInfo(
  Downloader.currentPlatform(), chromiumRevision);

console.log(revisionInfo.executablePath);

exports.executablePath = revisionInfo.executablePath;
