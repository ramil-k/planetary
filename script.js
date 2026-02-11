(function () {
    var solarSystem = document.querySelector('.solar-system');
    var center = { x: 450, y: 300 };

    // Planets in DOM order: п, л, а, н, е, т, а, р, й
    // Each starts on its orbit. Initial angle places them in a "planet parade"
    // alignment - all to the left of center (angle = PI = leftmost point on ellipse)
    // п on outermost orbit = furthest left
    //
    // maxSpeed: max angular speed (rad/s) per planet - outer planets slower, inner faster
    // accel: acceleration step added every 100ms tick (rad/s)
    // decel: deceleration divisor applied every 100ms tick (speed /= decel)
    var planets = [
        { sel: '.btn-p',  a: 323, b: 190, maxSpeed: 0.30, accel: 0.04, decel: 1.08, dir:  1, angle: Math.PI },
        { sel: '.btn-l',  a: 289, b: 170, maxSpeed: 0.38, accel: 0.05, decel: 1.09, dir: -1, angle: Math.PI },
        { sel: '.btn-a1', a: 255, b: 150, maxSpeed: 0.46, accel: 0.06, decel: 1.10, dir:  1, angle: Math.PI },
        { sel: '.btn-n',  a: 221, b: 130, maxSpeed: 0.54, accel: 0.07, decel: 1.10, dir: -1, angle: Math.PI },
        { sel: '.btn-e',  a: 187, b: 110, maxSpeed: 0.62, accel: 0.08, decel: 1.11, dir:  1, angle: Math.PI },
        { sel: '.btn-t',  a: 153, b: 90,  maxSpeed: 0.72, accel: 0.09, decel: 1.11, dir: -1, angle: Math.PI },
        { sel: '.btn-a2', a: 119, b: 70,  maxSpeed: 0.84, accel: 0.11, decel: 1.12, dir:  1, angle: Math.PI },
        { sel: '.btn-r',  a: 85,  b: 50,  maxSpeed: 1.00, accel: 0.13, decel: 1.13, dir: -1, angle: Math.PI },
        { sel: '.btn-j',  a: 61,  b: 36,  maxSpeed: 1.20, accel: 0.15, decel: 1.14, dir:  1, angle: 0 },
    ];

    // Initialize DOM refs, per-planet current speed
    planets.forEach(function (p) {
        p.el = document.querySelector(p.sel);
        p.speed = 0;
    });

    function render() {
        planets.forEach(function (p) {
            var x = center.x + p.a * Math.cos(p.angle);
            var y = center.y + p.b * Math.sin(p.angle);
            p.el.style.left = x + 'px';
            p.el.style.top = y + 'px';
            p.el.style.transform = 'translate(-50%, -50%)';
        });
    }

    render();

    // Animation state
    var hovering = false;
    var animating = false;
    var lastTime = 0;
    var speedInterval = null;

    // Speed step runs every 100ms (like intuition.team algorithm)
    function speedStep() {
        var anyMoving = false;
        planets.forEach(function (p) {
            if (hovering) {
                p.speed = Math.min(p.maxSpeed, p.speed + p.accel);
                anyMoving = true;
            } else {
                p.speed = Math.max(0, Math.floor(p.speed / p.decel * 1000) / 1000);
                if (p.speed > 0.001) anyMoving = true;
                else p.speed = 0;
            }
        });
        if (!anyMoving) {
            clearInterval(speedInterval);
            speedInterval = null;
        }
    }

    // rAF loop: update angles based on per-planet speed
    function tick(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (dt > 0.1) dt = 0.016;

        var anyMoving = false;
        planets.forEach(function (p) {
            if (p.speed > 0) {
                p.angle += p.speed * p.dir * dt;
                anyMoving = true;
            }
        });

        render();

        if (anyMoving || hovering) {
            requestAnimationFrame(tick);
        } else {
            animating = false;
        }
    }

    function startAnimation() {
        hovering = true;
        if (!speedInterval) {
            speedInterval = setInterval(speedStep, 100);
        }
        if (!animating) {
            animating = true;
            lastTime = 0;
            requestAnimationFrame(tick);
        }
    }

    function stopAnimation() {
        hovering = false;
    }

    solarSystem.addEventListener('mouseenter', startAnimation);
    solarSystem.addEventListener('mouseleave', stopAnimation);
})();
