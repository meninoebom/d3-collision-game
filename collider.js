var game = {};

game.config = {

    gameDuration: 10,
    speed: 1250,
    canvas: {
        width: 600,
        height: 600
    },
    hero: {
        radius: 20
    },
    enemies: {
        number: 10,
        radius: 20
    },
    hitCountDisplay: (function(){ return d3.select('.hits-counter')})(),
    countdownDisplay: (function(){ return d3.select('.countdown-display')})()
}

game.getRandomX = function() {

    var canvasWidth = game.config.canvas.width
      , canvasHeight = game.config.canvas.height
      , enemyRadius = game.config.enemies.radius;

    return Math.floor( Math.random() * ( canvasWidth - (2 * enemyRadius) ) ) + enemyRadius;
}

game.getRandomY = function() {

    var canvasWidth = game.config.canvas.width
      , canvasHeight = game.config.canvas.height
      , enemyRadius = game.config.enemies.radius;

    return Math.floor( Math.random() * ( canvasHeight - (2 * enemyRadius) ) ) + enemyRadius;
}

game.enemyUpdate = function() {

    game.enemies.transition()
        .duration( game.config.speed )
        .attr('cx', function( d ) {
         return game.getRandomX() } )
        .attr('cy', function( d ) {
         return game.getRandomY() } )
        .tween('collision', function(d, i) {

          var eRad = this.getAttribute( 'r' )
          , hRad =  game.hero.attr( 'r' )
          , touched = false;

          return function(t) {

            var hx =  game.hero.attr( 'cx' )
            , hy =  game.hero.attr( 'cy' )
            , ex = this.getAttribute( 'cx' )
            , ey = this.getAttribute( 'cy' )
            , ex1 = ex - eRad
            , ex2 = ex + eRad
            , ey1 = ey - eRad
            , ey2 = ey + eRad
            , x = hx - ex
            , y = hy - ey
            , l = Math.sqrt(x * x + y * y)
            , r = parseInt(hRad) + parseInt(eRad);
            if (!touched && l < r) {

              game.hitCount++;
              game.config.hitCountDisplay.html(game.hitCount);
              touched = true;
            }
            // return ex1 > hx2 || ex2 < hx1 || ey1 > hy2 || ey2 < hy1;
          }
        }); // end of .tween
}

game.drag = d3.behavior.drag()
    .on('dragstart', function() {

    })
    .on('drag', function() {
        // If the next x and y are in bounds, move
        var newX = d3.event.x
          , newY = d3.event.y
          , width = game.config.canvas.width
          , height = game.config.canvas.height
          , hr = game.config.hero.radius;

        if(newX >= hr && newX <= width - hr) {
          game.hero.attr('cx', d3.event.x);
        }
        
        if(newY >= hr && newY <= height - hr) {
          game.hero.attr('cy', d3.event.y);
        }
    })
    .on('dragend', function() {

    })

game.startCountdown = function( count ) {

  var display = game.config.countdownDisplay;
  display.html( count );
  var countdownID = window.setInterval(function() {

    if ( count ) {

      count--;
      display.html( count );
    } else {
      window.clearInterval(countdownID);
      game.stop();
    }
  }, 1000);
}

// Stuff that happens everytime the game restarts
game.start = function() {

  game.lowestHitCountView.style('visibility', 'hidden');
  game.hitCount = 0;
  game.config.hitCountDisplay.html('0');

  game.hero
      .attr('cx', function() {

          return game.config.canvas.width/2
      })
      .attr('cy', function() {

          return game.config.canvas.height/2
      });

  // Reset the data for creating enemies    
  game.enemyData = [];

  for (var i = 0; i < game.config.enemies.number; i++ ) {

      var enemyRadius = game.config.enemies.radius
      , x = game.getRandomX()
      , y = game.getRandomY()
      , enemy = {id: i, x: x, y: y}

      game.enemyData.push(enemy)
  }

  // tell canvas to selectAll
  // this data is no in the dom yet but somehow we know that these future elements will be children of canvas
  game.enemies = game.canvas.selectAll('.enemy' ).data(game.enemyData);

  // here we enter the data    
  game.enemies.enter()
      .append( 'circle' )
      .attr( 'r', game.config.enemies.radius )
      .attr( 'class', 'enemy')
      .attr( 'cx', function( d ) {

          return d.x
      })
      .attr( 'cy', function( d ) {

          return d.y
      });

  game.transitionUpdateIntervalID = window.setInterval(game.enemyUpdate, game.config.speed);
  game.startCountdown( game.config.gameDuration );
  game.hero.call(game.drag);
}

//stuff that happens when the game is over
game.stop = function() {

  window.clearInterval(game.transitionUpdateIntervalID);
  window.setTimeout(function(){

    game.enemies.remove();
    game.startBtn.attr('disabled', null);

    if(!game.lowestHitCount || game.hitCount < game.lowestHitCount) {
      game.lowestHitCount = game.hitCount;
      // Show the all stars form and make sure the input and button are showing
      $('.lowest-hit-count-view').css('visibility', 'visible').find('form').css('display', 'block');
      if(game.lowestHitCountList.length > 0){
          $('.lowest-hit-count-list-header').css('display','block');
      }
    }
  }, 500);
}

// Stuff that only happens once
var initColliderGame = function() {

  // Setup the gameboard
  game.canvas = d3.select('.game-container').append('svg:svg')
      .attr('class', 'canvas')
      .attr('height', game.config.canvas.width)
      .attr('width', game.config.canvas.height);

  // Setup the hero
  game.hero = game.canvas.append('circle')
      .attr('class', 'hero')
      .attr('r', game.config.hero.radius)
      .attr('cx', function() {

          return game.config.canvas.width/2
      })
      .attr('cy', function() {

          return game.config.canvas.height/2
      });

  game.startBtn = d3.select('.start-btn');

  game.startBtn.on('click', function() {

    game.start();
    game.startBtn.attr('disabled', 'disabled').html('Restart');
  });

  game.lowestHitCountView = d3.select('.lowest-hit-count-view');
  game.lowestHitCountBtn = game.lowestHitCountView.select('.lowest-hit-count-btn');
  game.lowestHitCountList = [];
  var $allStarList = $('.lowest-hit-count-list');
  game.lowestHitCountList.forEach(function(item, ind, arr) {
    $allStarList.prepend('<li class="lowest-hit-count-list-item">Player: <span class="lowest-hit-count-list-item-name">'+item.playerName+'</span> Hit Count: <span class="lowest-hit-count-list-item-count">'+item.count+'</span> Date: <span class="lowest-hit-count-list-item-date">'+item.date+'</span></li>');
  });

  game.lowestHitCountBtn.on('click', function() {
     var lowestHitCountName = $('#lowest-hit-count-name-field').val();
     var lowestHitCount = game.hitCount;
     var lowestHitCountDate = new Date();
     game.lowestHitCountList.push({
        playerName: lowestHitCountName,
        count: lowestHitCount,
        date: lowestHitCountDate
     });
     $allStarList.prepend('<li class="lowest-hit-count-list-item">Player: <span class="lowest-hit-count-list-item-name">'+lowestHitCountName+'</span> Hit Count: <span class="lowest-hit-count-list-item-count">'+lowestHitCount+'</span> Date: <span class="lowest-hit-count-list-item-date">'+lowestHitCountDate+'</span></li>');
     $('.lowest-hit-count-view').find('form').fadeOut('slow');
     // in case the header is not showing
     $('.lowest-hit-count-list-header').css('display','block');
  });
}

initColliderGame();



