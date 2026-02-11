(function () {
    var solarSystem = document.querySelector('.solar-system');
    var center = { x: 450, y: 300 };
    var maxRadius = 450; // distance from center to edge of solar-system

    // Planets in DOM order: п, л, а, н, е, т, а, р, й
    // Each starts on its orbit. Initial angle places them in a "planet parade"
    // alignment - all to the left of center (angle = PI = leftmost point on ellipse)
    // п on outermost orbit = furthest left
    //
    // maxSpeed: max angular speed (rad/s) per planet - outer planets slower, inner faster
    // accel: acceleration step added every 100ms tick (rad/s)
    // decel: deceleration divisor applied every 100ms tick (speed /= decel)
    var planets = [
        { sel: '.btn-p',  a: 323, b: 190, maxSpeed: 6.0,  accel: 0.8,  decel: 1.08, dir:  1, angle: Math.PI },
        { sel: '.btn-l',  a: 289, b: 170, maxSpeed: 7.6,  accel: 1.0,  decel: 1.09, dir: -1, angle: Math.PI },
        { sel: '.btn-a1', a: 255, b: 150, maxSpeed: 9.2,  accel: 1.2,  decel: 1.10, dir:  1, angle: Math.PI },
        { sel: '.btn-n',  a: 221, b: 130, maxSpeed: 10.8, accel: 1.4,  decel: 1.10, dir: -1, angle: Math.PI },
        { sel: '.btn-e',  a: 187, b: 110, maxSpeed: 12.4, accel: 1.6,  decel: 1.11, dir:  1, angle: Math.PI },
        { sel: '.btn-t',  a: 153, b: 90,  maxSpeed: 14.4, accel: 1.8,  decel: 1.11, dir: -1, angle: Math.PI },
        { sel: '.btn-a2', a: 119, b: 70,  maxSpeed: 16.8, accel: 2.2,  decel: 1.12, dir:  1, angle: Math.PI },
        { sel: '.btn-r',  a: 85,  b: 50,  maxSpeed: 20.0, accel: 2.6,  decel: 1.13, dir: -1, angle: Math.PI },
        { sel: '.btn-j',  a: 61,  b: 36,  maxSpeed: 24.0, accel: 3.0,  decel: 1.14, dir:  1, angle: 0 },
    ];

    // Initialize DOM refs, per-planet current speed and initial angle
    planets.forEach(function (p) {
        p.el = document.querySelector(p.sel);
        p.speed = 0;
        p.initialAngle = p.angle;
    });

    function render() {
        planets.forEach(function (p) {
            var x = center.x + p.a * Math.cos(p.angle);
            var y = center.y + p.b * Math.sin(p.angle);
            p.el.style.transform = 'translate(calc(' + x + 'px - 50%), calc(' + y + 'px - 50%))';
        });
    }

    render();

    // Animation state
    var hovering = false;
    var animating = false;
    var lastTime = 0;
    var speedInterval = null;
    var proximity = 0; // 0 = edge, 1 = center

    // Speed step runs every 100ms (like intuition.team algorithm)
    function speedStep() {
        var anyMoving = false;
        planets.forEach(function (p) {
            var target = p.maxSpeed * proximity * proximity * proximity;
            if (hovering) {
                p.decelSnap = null;
                if (p.speed < target) {
                    p.speed = Math.min(target, p.speed + p.accel);
                } else {
                    p.speed = Math.max(target, Math.floor(p.speed / p.decel * 1000) / 1000);
                }
                anyMoving = true;
            } else {
                var d = p.decelSnap ?? p.decel;
                p.speed = Math.max(0, Math.floor(p.speed / d * 1000) / 1000);
                if (p.speed > 0.001) {
                    anyMoving = true;
                } else {
                    p.speed = 0;
                    p.angle = p.initialAngle;
                    p.decelSnap = null;
                }
            }
        });
        if (!anyMoving) {
            clearInterval(speedInterval);
            speedInterval = null;
            render();
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

    function updateProximity(clientX, clientY) {
        var rect = solarSystem.getBoundingClientRect();
        var scale = rect.width / 900;
        var mx = (clientX - rect.left) / scale - center.x;
        var my = (clientY - rect.top) / scale - center.y;
        var dist = Math.sqrt(mx * mx + my * my);
        proximity = Math.max(0, Math.min(1, 1 - dist / maxRadius));
    }

    function onMouseMove(e) {
        updateProximity(e.clientX, e.clientY);
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

    // Normalize angle to [0, 2*PI)
    function normalizeAngle(a) {
        a = a % (2 * Math.PI);
        return a < 0 ? a + 2 * Math.PI : a;
    }

    // When interaction stops, compute per-planet decel so it lands on initialAngle.
    // Total distance with geometric decel: S = speed * tickDt * decel / (decel - 1)
    // We need S = remainingAngle, so decel = S / (S - speed * tickDt)
    function snapDecel() {
        var tickDt = 0.1; // speed step interval
        planets.forEach(function (p) {
            if (p.speed <= 0) return;
            // Distance per first tick
            var stepDist = p.speed * tickDt;
            // How far to the next initial angle position (in the direction of travel)
            var current = normalizeAngle(p.angle);
            var target = normalizeAngle(p.initialAngle);
            var remaining = target - current;
            // Ensure we go forward (at least one more full revolution to look smooth)
            if (p.dir > 0) {
                if (remaining <= stepDist) remaining += 2 * Math.PI;
            } else {
                remaining = -remaining;
                if (remaining <= stepDist) remaining += 2 * Math.PI;
            }
            // decel = remaining / (remaining - stepDist)
            var d = remaining / (remaining - stepDist);
            // Clamp to reasonable range
            p.decelSnap = Math.max(1.01, Math.min(d, 1.5));
        });
    }

    function stopAnimation() {
        hovering = false;
        snapDecel();
    }

    // Mouse
    solarSystem.addEventListener('mouseenter', function () {
        solarSystem.addEventListener('mousemove', onMouseMove);
        startAnimation();
    });
    solarSystem.addEventListener('mouseleave', function () {
        solarSystem.removeEventListener('mousemove', onMouseMove);
        stopAnimation();
    });

    // Touch — bind on document so touches anywhere on screen work
    document.addEventListener('touchstart', function (e) {
        e.preventDefault();
        updateProximity(e.touches[0].clientX, e.touches[0].clientY);
        startAnimation();
    }, { passive: false });
    document.addEventListener('touchmove', function (e) {
        e.preventDefault();
        updateProximity(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchend', function () {
        stopAnimation();
    });

    // Scale solar system to fit viewport
    function fitToViewport() {
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var scaleX = vw / 900;
        var scaleY = vh / 600;
        var scale = Math.min(scaleX, scaleY);
        solarSystem.style.transform = scale < 1
            ? 'translate(-50%, -50%) scale(' + scale + ')'
            : 'translate(-50%, -50%)';
    }

    fitToViewport();
    window.addEventListener('resize', fitToViewport);
})();
