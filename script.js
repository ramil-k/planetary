(function () {
    var solarSystem = document.querySelector('.solar-system');
    var center = { x: 450, y: 300 };

    // Planets in DOM order: п, л, а, н, е, т, а, р, й
    // Each starts on its orbit. Initial angle places them in a "planet parade"
    // alignment - all to the left of center (angle = PI = leftmost point on ellipse)
    // п on outermost orbit = furthest left
    var planets = [
        { sel: '.btn-p',  a: 323, b: 190, speed: 0.20, dir:  1, angle: Math.PI },  // п - leftmost
        { sel: '.btn-l',  a: 289, b: 170, speed: 0.23, dir: -1, angle: Math.PI },  // л
        { sel: '.btn-a1', a: 255, b: 150, speed: 0.26, dir:  1, angle: Math.PI },  // а
        { sel: '.btn-n',  a: 221, b: 130, speed: 0.30, dir: -1, angle: Math.PI },  // н
        { sel: '.btn-e',  a: 187, b: 110, speed: 0.34, dir:  1, angle: Math.PI },  // е
        { sel: '.btn-t',  a: 153, b: 90,  speed: 0.38, dir: -1, angle: Math.PI },  // т
        { sel: '.btn-a2', a: 119, b: 70,  speed: 0.44, dir:  1, angle: Math.PI },  // а
        { sel: '.btn-r',  a: 85,  b: 50,  speed: 0.52, dir: -1, angle: Math.PI },  // р
        { sel: '.btn-j',  a: 61,  b: 36,  speed: 0.62, dir:  1, angle: 0 },        // й - right of logo
    ];

    // Initialize DOM refs and place at initial orbit positions
    planets.forEach(function (p) {
        p.el = document.querySelector(p.sel);
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
    var targetSpeed = 0;
    var currentSpeed = 0;
    var animating = false;
    var lastTime = 0;

    function tick(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (dt > 0.1) dt = 0.016;

        // Smooth acceleration / deceleration
        if (targetSpeed > currentSpeed) {
            currentSpeed = Math.min(targetSpeed, currentSpeed + dt * 1.0);
        } else {
            currentSpeed = Math.max(0, currentSpeed - dt * 0.2);
        }

        planets.forEach(function (p) {
            p.angle += p.speed * p.dir * currentSpeed * dt;
        });

        render();

        if (currentSpeed > 0.001) {
            requestAnimationFrame(tick);
        } else {
            currentSpeed = 0;
            animating = false;
        }
    }

    function startAnimation() {
        targetSpeed = 1;
        if (!animating) {
            animating = true;
            lastTime = 0;
            requestAnimationFrame(tick);
        }
    }

    function stopAnimation() {
        targetSpeed = 0;
    }

    solarSystem.addEventListener('mouseenter', startAnimation);
    solarSystem.addEventListener('mouseleave', stopAnimation);
})();
