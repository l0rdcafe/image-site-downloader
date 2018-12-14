const fs = require("fs");
const { exec } = require("child_process");
const ProgressBar = require("progress");
const chalk = require("chalk");
const Nightmare = require("nightmare");

function getImgUrls(query) {
  return new Promise((resolve, reject) => {
    const nightmare = Nightmare();
    const bar = new ProgressBar(":bar", { total: 10 });
    const timer = setInterval(() => {
      bar.tick();
      if (bar.complete) {
        clearInterval(timer);
      }
    }, 100);
    nightmare
      .goto(`https://pixabay.com/en/photos/${query}`)
      .wait("img")
      .evaluate(() =>
        [...document.querySelectorAll("img")]
          .map(img => img.getAttribute("src"))
          .filter(url => !url.startsWith("/static"))
      )
      .end()
      .then(urls => resolve(urls))
      .catch(err => reject(err));
  });
}

function downloadImgs(imgs) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync("./imgs")) {
      fs.mkdirSync("./imgs", error => {
        if (error) {
          reject(error);
        }
      });
    }

    imgs.forEach(path => {
      exec(`cd imgs && curl -OL ${path} && cd ..`, (err, stdout, stderr) => {
        if (err || stderr) {
          reject(err || stderr);
        }

        const bar = new ProgressBar(":percent", { total: 10 });
        const timer = setInterval(() => {
          bar.tick();

          if (bar.complete) {
            console.log(`${chalk.green(path)} successfully downloaded.`);
            clearInterval(timer);
          }
        }, 100);
      });
    });
    resolve();
  });
}

async function main() {
  if (process.argv.length < 3) {
    console.log("Please provide a search query to download images.");
    process.exit(1);
  }
  try {
    const query = process.argv[2];
    const imgUrls = await getImgUrls(query);
    await downloadImgs(imgUrls);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

main();
