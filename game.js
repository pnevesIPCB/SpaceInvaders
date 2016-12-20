/**
 * Created by Mary Foley & pauloalexandreneves on 02/02/15.
 * Append on 14/11/16 - lives, score & bullet out of canvas control
 * Append on 17/11/16 - support for game keys
 */
;(function(){
    var Game = function(canvasId) {
        var canvas = document.getElementById(canvasId);
        var screen = canvas.getContext('2d');
        this.gameSize = {x: canvas.width, y: canvas.height};

        //game state attributes
        this.gameOver = false;
        this.gamePaused = false;
        this.newGame = false;
        this.helpScreen = true;

        //score and lives attributes
        this.score = 0;
        this.lives = 3;
        this.currentInvaders = 24;
        this.playerPresent = false;

        //keyboard object
        this.keyboarder = new Keyboarder();

        this.bodies = createInvaders(this).concat(new Player (this, this.gameSize));

        var self = this;

        // sound is loaded on game, slows things down. How can I make it faster?
        loadSound ("shoot.mp3", function (shootSound) {
            self.shootSound = shootSound;
            self.shootSound.load();
        });


        var tick = function () {
            self.gameKeys();
            requestAnimationFrame(tick);
            console.log ("help:"+self.helpScreen);
            console.log ("newgame:"+self.newGame);
            if (!self.gameOver) {
                if (!self.gamePaused && !self.helpScreen && !self.newGame) {
                    self.update();
                    self.draw(screen);
                }
                else if (self.newGame){
                    self.newGame = false;
                    self.helpScreen = false;

                    //reset game
                    self.score = 0;
                    self.lives = 3;
                    self.currentInvaders = 24;
                    self.bodies = createInvaders(self).concat(new Player (self, self.gameSize));
                }

                else if (self.gamePaused) {
                    screen.clearRect(0, 0, self.gameSize.x, self.gameSize.y);
                    screen.fillStyle = "red";
                    screen.fillText ("PAUSED", 130, 170);
                }
                else{
                    screen.clearRect(0, 0, self.gameSize.x, self.gameSize.y);
                    screen.fillStyle = "red";
                    screen.fillText ("GAME KEYS:", 110, 130);
                    screen.fillText ("n: new game", 110, 150);
                    screen.fillText ("p: pause", 110, 170);
                    screen.fillText ("<-: go left", 110, 190);
                    screen.fillText ("->: go right", 110, 210);
                    screen.fillText ("SPACE: Shoot", 110, 230);

                }
            }
            else{
                screen.clearRect(0, 0, self.gameSize.x, self.gameSize.y);
                screen.fillStyle = "red";
                screen.fillText ("GAME OVER", 120, 170);
            }
        };
        tick();

    };

    Game.prototype = {
        update: function(){
            var playerPresent = false;
            var bodies = this.bodies;
            var gameSize = this.gameSize;

            //notCollidingWithAnything enables comparison between two bodies
            //the two filters enable "double for" to compare pairs of bodies
            var notCollidingWithAnything = function(body1){
                return bodies.filter ( function(body2){ return colliding (body1, body2);}).length === 0;
            };
            this.bodies = this.bodies.filter (notCollidingWithAnything);


            //destroy all bullets that fall outside of canvas
            // remainingBullets creates the function that filters all but the bullets that must be removed
            var remainingBullets = function (body){
                    return !(body instanceof Bullet
                            &&
                        ( ( (body.velocity.y > 0) && (body.center.y > gameSize.y) ) ||
                          ( (body.velocity.y < 0) && (body.center.y < 0) )  )
                    )
            };
            this.bodies = this.bodies.filter (remainingBullets);

            var invaderCount = 0;
            this.playerPresent = false;
            var numberPlayers = 0;
            for (var i = 0; i < this.bodies.length; i++) {
                if (this.bodies[i] instanceof Invader)
                    invaderCount++;
                else if (this.bodies[i] instanceof Player) {
                    numberPlayers++;

                    this.playerPresent = true;
                }

            }

            if (!this.playerPresent){
                if (this.lives > 1) {
                    this.lives--;
                    this.bodies.push (new Player(this, this.gameSize));
                    this.playerPresent = true;
                }
                else
                    this.gameOver = true;
            }

            this.score += (this.currentInvaders - invaderCount) * 10;
            this.currentInvaders = invaderCount;

            for (var i = 0; i < this.bodies.length; i++) {
                this.bodies[i].update();

            }


        },

        draw: function(screen/*, gameSize*/) {
            screen.clearRect(0, 0, this.gameSize.x, this.gameSize.y);
            for (var i = 0; i < this.bodies.length; i++) {
                drawRect(screen, this.bodies[i]);
            }

            screen.fillStyle = "red";
            screen.fillText ("Score: "+this.score, 10, 10);

            screen.fillText ("Space invaders", this.gameSize.x/2-40, 10);
            if (this.lives > 0)
                screen.fillText (" Lives: " + this.lives, this.gameSize.x/2+100, 10);
            else
                screen.fillText (" Lives: " + "OVER", this.gameSize.x/2+100, 10);
            screen.fillStyle = "black";
        },

        addBody: function(body){
            this.bodies.push(body);
        },

        invadersBellow: function (invader){
            return this.bodies.filter ( function(b){
               return b instanceof Invader &&
                   b.center.y > invader.center.y &&
                   b.center.x - invader.center.x < invader.size.x;
            }).length > 0;
        },

        gameKeys: function (){
            /*
            if (this.keyboarder.isDown(this.keyboarder.KEYS.PAUSE) && this.gamePaused === false){
                this.gamePaused = true;
            }
            else if (this.keyboarder.isUp(this.keyboarder.KEYS.PAUSE) && this.gamePaused === true){
                this.gamePaused = false;
            }
            */

            if (this.keyboarder.wasToggled(this.keyboarder.KEYS.PAUSE)){
                this.gamePaused = !this.gamePaused;
            }

            if (this.keyboarder.wasToggled(this.keyboarder.KEYS.NEWGAME)){
                this.newGame = true;
            }


            //must support game recreation and game help
        }

    };

    var Player = function (game, gameSize){
        this.game = game;
        this.size = {x: 15, y:15};
        this.gameSize = gameSize;
        this.center = {x: gameSize.x / 2, y: gameSize.y - this.size.y / 2 };
        //this.keyboarder = new Keyboarder();

    };

    Player.prototype = {
        update: function (){
            var canShoot = true;
            if (this.game.keyboarder.isDown (this.game.keyboarder.KEYS.LEFT)){
                if (this.center.x > this.size.x)
                    this.center.x -= 2;
            }
            else if (this.game.keyboarder.isDown (this.game.keyboarder.KEYS.RIGHT)){
                if ( this.center.x < ( this.gameSize.x - this.size.x / 2) )
                    this.center.x += 2;
            }

            if (this.game.keyboarder.isDown (this.game.keyboarder.KEYS.SPACE)) {
                for (var i = 0;i < this.game.bodies.length; i++){
                    if (this.game.bodies[i] instanceof Bullet){
                        if (this.game.bodies[i].velocity.y < 0)
                            canShoot = false;
                    }
                }
                if (canShoot) {
                    var bullet = new Bullet({x: this.center.x, y: this.center.y - this.size.y/2},
                        {x: 0, y: -6}, "player" );
                    this.game.addBody(bullet);

                    this.game.shootSound.play();
                }
            }
        }
    };


    var Bullet = function(center, velocity, source){
        this.size = {x: 3, y: 3};
        this.center = center;
        this.velocity = velocity;
        this.source = source;

    };

    Bullet.prototype = {
        update: function (){
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;
        }

    };


    var Invader = function (game, center){
        this.game = game;
        this.size = {x: 15, y: 15};
        this.center = center;
        this.patrolX = 0;
        this.speedX = 0.3;
    };

    Invader.prototype = {
        update: function() {
            if (this.patrolX < 0 || this.patrolX > 40) {
                this.speedX = -this.speedX;
            }

            this.center.x += this.speedX;
            this.patrolX += this.speedX;

            if (Math.random() > 0.995 && !this.game.invadersBellow(this)) {
                var bullet = new Bullet ({x: this.center.x, y: this.center.y + this.size.x / 2},
                    {x:  Math.random() - 0.5 , y: 2});
                this.game.addBody (bullet);
            }
      }


    };

    var createInvaders = function (game){
        var invaders = [];
        for ( var i = 0; i<24; i++) {
            var x = 30 + (i % 8) * 30;
            var y = 30 + (i % 3) * 30;
            invaders.push(new Invader(game, {x: x, y: y}));
        }
        return invaders;
    };

    var drawRect = function(screen, body){
        screen.fillRect (body.center.x - body.size.x / 2, body.center.y - body.size.y / 2, body.size.x, body.size.y);
    };

    var Keyboarder = function(){
        var keyState = {};
        var keyToggleState = {};
        window.onkeydown = function (e){
            keyState[e.keyCode] = true;
            keyToggleState [e.keyCode] = 1;
        };

        window.onkeyup = function (e){
            keyState[e.keyCode] = false;
            keyToggleState [e.keyCode] = 2;
        };

        this.isDown = function (keyCode){
            return keyState[keyCode] === true;
        };

        this.isUp = function (keyCode){
            return keyState[keyCode] === false;
        };

        this.wasToggled = function (keyCode){
            if (keyToggleState[keyCode] == 2){
                keyToggleState[keyCode] = 0;
                return true;
            }
            else
                return false;

        };
        this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32, PAUSE: 80, NEWGAME: 78, HELP: 72};

        //toggle state
        // 0 not on
        //1 on
        //2 toggled
        //this.STATE = {left = false}

    };

    //true if b1 and b2 are colliding and b1 is not b2
    var colliding = function (b1, b2){
        if (b1 === b2)
            return false;
        else
          return!(
              b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
              b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
              b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
              b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2);
    };



    var loadSound = function (url, callback){
        var loaded = function(){
            callback (sound);
            sound.removeEventListener('canplaythrough', loaded);
        };

        var sound = new Audio(url);
        sound.addEventListener ('canplaythrough', loaded);
        sound.load();
    };

    window.onload = function(){
        new Game ("screen");
    };

})();