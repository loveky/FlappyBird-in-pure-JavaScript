(function (window, document) {
  'use strict';

  var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
  var isIE = /*@cc_on!@*/false || !!document.documentMode;

  function Game (elementID) {
    var game = this;
    var canvas = document.getElementById(elementID);

    game.ctx = canvas.getContext('2d');
    game.screenWidth = canvas.scrollWidth;
    game.screenHeight = canvas.scrollHeight;
    game.score = 0;

    game.drawWelcomePage();

    game.keydownHandler = function (event) {
      if (event.keyCode === 13) {
        game.start();
      }
      window.removeEventListener("keydown", game.keydownHandler, false);
    };

    window.addEventListener("keydown", game.keydownHandler, false);
  }

  Game.prototype.drawWelcomePage = function () {
    this.clearScreen();

    this.ctx.font = "25pt Arial";
    this.ctx.fillText("Press enter to start...", 100, 100);
  };

  Game.prototype.start = function () {
    var game = this;
    var bird = new Bird(game);
    var gaps = [250, 400, 550, 700, 850].map(function (xPos) {
      return new Gap(game, xPos);
    });
    gaps.destroied = 0;

    game.intervalID = setInterval(tick, 20);

    game.score = 0;

    function tick () {
      gaps.passed = 0;
      game.clearScreen();
      bird.fly();
      gaps.forEach(function (gap) {
        if (bird.isAtScreenCenter()) {
          gap.move();
        }
        if (gap.xPos + gap.width / 2 <= 0) {
          gaps.shift();
          gaps.destroied++;
          gaps.push(new Gap(game, gaps[gaps.length - 1].xPos + 150));
        }

        if (gap.xPos + gap.width / 2 < bird.xPos - bird.width / 2) {
          gaps.passed++;
        }

        if (gap.collisionWith(bird)) {
          game.gameover();
        }
      });

      if (gaps.passed + gaps.destroied > game.score) {
        game.scoreSound.play();
        game.score = gaps.passed + gaps.destroied;
      }

      render();
    } 

    function render () {
      game.ctx.font = "15pt Arial";
      game.ctx.fillText("Score: " + game.score, 10, 20);  

      bird.render();
      gaps.forEach(function (gap) {
        gap.render();
      });

    }
  };

  Game.prototype.gameover = function () {
    clearInterval(this.intervalID);

    this.ctx.save();
    this.ctx.font = "40pt Arial";
    this.ctx.fillText("GAME OVER", 75, 100);
    this.ctx.font = "15pt Arial";
    this.ctx.fillText("Press enter to play again!", 130, 150);
    this.ctx.restore();
    window.addEventListener("keydown", this.keydownHandler, false);
  };

  Game.prototype.clearScreen = function () {
    this.ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);
  };

  Game.prototype.scoreSound = new Audio();
  Game.prototype.scoreSound.autoplay = false;
  Game.prototype.scoreSound.src = isSafari || isIE ? "sounds/score.mp3" : "sounds/score.ogg";

  function Gap (game, xPos) {
    this.game = game;
    this.xPos = xPos;
    this.yPos = Math.floor(Math.random() * (game.screenHeight - this.height)) + this.height / 2;
    this.xSpeed = 1.5;
  }

  Gap.prototype.height = 70;
  Gap.prototype.width = 50;

  Gap.prototype.render = function () {
    this.game.ctx.globalCompositeOperation = "destination--over";
    this.game.ctx.drawImage(this.pipeImage, (this.xPos - this.width / 2), (this.yPos + (this.height / 2)), 50, 154);
    this.game.ctx.save();
    this.game.ctx.scale(1, -1);
    this.game.ctx.drawImage(this.pipeImage, (this.xPos - this.width / 2), -(this.yPos - (this.height / 2)), 50, 154);
    this.game.ctx.restore();
  };

  Gap.prototype.move = function () {
    this.xPos -= this.xSpeed;
  };

  Gap.prototype.collisionWith = function (thing) {
    if (thing.xPos - thing.width / 2 > this.xPos + this.width / 2 || thing.xPos + thing.width / 2 < this.xPos - this.width / 2) {
      return false;
    }
    else if ((thing.yPos - thing.height / 2 > this.yPos - this.height / 2) && (thing.yPos + thing.height / 2 < this.yPos + this.height / 2)) {
      return false;
    }
    else {
      return true;
    }
  };

  Gap.prototype.pipeImage = new Image();
  Gap.prototype.pipeImage.addEventListener("load", function () {
    Gap.ready = true;
  });
  Gap.prototype.pipeImage.src = "images/pipe.png";

  function Bird (game) {
    this.game = game;
    this.xPos = this.width / 2;
    this.yPos = game.screenHeight / 2;
    this.xSpeed = 1.5;
    this.ySpeed = 0;

    this.keydownHandler = function (event) {
      if (event.keyCode === 13) {
        this.ySpeed = 5;
        this.sound.play();
      }
    }.bind(this);

    window.addEventListener("keydown", this.keydownHandler, false);
  }

  Bird.prototype.width = 30;
  Bird.prototype.height = 21;

  Bird.prototype.render = function () {
    this.game.ctx.globalCompositeOperation = "destination-over";
    this.game.ctx.drawImage(this.image, this.xPos - this.width / 2, this.yPos - this.height / 2, this.width, this.height);
  };

  Bird.prototype.fly = function () {
    this.xPos = this.xPos + this.xSpeed;
    this.yPos = this.yPos - this.ySpeed;

    if (this.xPos + this.width / 2 > this.game.screenWidth / 2) {
      this.xPos = this.game.screenWidth / 2 - this.width / 2;
      this.xSpeed = 0;
    }

    if (this.yPos - this.height / 2 <= 0) {
      this.yPos = this.height / 2;
      this.ySpeed = 0;
    }

    if (this.yPos + this.height / 2 >= this.game.screenHeight) {
      this.yPos = this.game.screenHeight - this.height / 2;
      this.die();
    }

    this.ySpeed -= 0.5;
  };

  Bird.prototype.isAtScreenCenter = function () {
    return this.xPos + this.width / 2 === this.game.screenWidth / 2;
  };

  Bird.prototype.die = function () {
    window.removeEventListener("keydown", this.keydownHandler, false);
    this.game.gameover();
  };

  Bird.prototype.sound = new Audio();
  Bird.prototype.sound.autoplay = false;
  Bird.prototype.sound.src = isSafari || isIE ? "sounds/fly.mp3" : "sounds/fly.ogg";

  Bird.prototype.image = new Image();
  Bird.prototype.image.addEventListener("load", function () {
    Bird.ready = true;
  });
  Bird.prototype.image.src = "images/bird.png";

  new Game("playground");
})(window, window.document);