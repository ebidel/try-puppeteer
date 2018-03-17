## Try Puppeteer!

> Run [Puppeteer](https://github.com/GoogleChrome/puppeteer) scripts in the cloud.

Try it: https://try-puppeteer.appspot.com

## Develop

Installation:

```sh
yarn; yarn install-backend
# or npm i
```

### Backend

The backend is a Docker container which installs the latest Chrome package
that works with Puppeteer on Linux.

> **Note**: You'll need to have Docker running before attempting each step in this section.

#### Building it

```sh
yarn build
```

#### Running the container

The container can be run in two modes: standalone as an executable, or as a web service.

**1. Using the standalone CLI**

The first is a "standalone" mode that runs a Puppeteer script from the CLI. It takes a script file as an argument and runs it in the container.

```
./backend/run_puppeteer.sh your-puppeteer-script.js
```

**2. Running the web service**

The second option is running the container as a web server. The endpoint accepts
file uploads for running your Puppeteer scripts in the cloud:

Start the server:

```sh
cd backend
yarn serve
# yarn restart is handy too. It rebuilds the container and starts the server.
```

**Example** - running a Puppeteer script

```js
async function runCode(code) {
  const form = new FormData();
  form.append('file', new Blob([code], {type: 'text/javascript'}));
  const resp = await fetch('http://localhost:8080/run', {method: 'POST', body: form});
  return await resp.json();
}

const code = `
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log(await page.content());
  browser.close();
`;

runCode(code).then(result => {
  if (result.errors) {
    console.error(result.errors);
  }
  console.log(result.log);
});
```

**Notes**:

- There's no need to `require('puppeteer')`. This is done for you on the backend.
- Top-level async/await are supported.

### Code editor frontend

Fire up the code editor UI from the main directory:

```
yarn serve
```

Then navigate to `http://localhost:8081`.


## Deployment

1. Update the version of Puppeteer used in index.html, include the doc link. TODO: make this automatic.

2. `yarn deploy` deploys both the frontend and backend services to App Engine Flex. The
apps can also be deployed individually:

```sh
yarn deploy-frontend
yarn deploy-backend
```

## Notes & Limitations

- By default, Puppeteer launches and uses its own bundled version of Chromium. To use
  the [`google-chrome-unstable`](https://www.ubuntuupdates.org/ppa/google_chrome) installed by the container, pass `executablePath`:

  ```js
  const browser = await puppeteer.launch({
    executablePath: 'google-chrome-unstable'
  });
  ```
