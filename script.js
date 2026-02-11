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
    var TWO_PI = 2 * Math.PI;
    var RETURN_DURATION = 2.0; // seconds for ease-out return

    // Ease-out cubic: decelerates smoothly to zero velocity
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Speed step runs every 100ms (like intuition.team algorithm)
    // Only active while hovering
    function speedStep() {
        if (!hovering) return;
        planets.forEach(function (p) {
            var target = p.maxSpeed * proximity * proximity * proximity;
            if (p.speed < target) {
                p.speed = Math.min(target, p.speed + p.accel);
            } else {
                p.speed = Math.max(target, Math.floor(p.speed / p.decel * 1000) / 1000);
            }
        });
    }

    // rAF loop: update angles based on per-planet speed or return animation
    function tick(timestamp) {
        if (!lastTime) lastTime = timestamp;
        var dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
        if (dt > 0.1) dt = 0.016;

        var anyMoving = false;
        planets.forEach(function (p) {
            if (p.returning) {
                var elapsed = (timestamp - p.returnStart) / 1000;
                var t = Math.min(1, elapsed / p.returnDuration);
                p.angle = p.returnFrom + (p.returnTo - p.returnFrom) * easeOutCubic(t);
                if (t < 1) {
                    anyMoving = true;
                } else {
                    p.angle = p.initialAngle;
                    p.returning = false;
                    p.speed = 0;
                }
            } else if (p.speed > 0) {
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
        // Cancel any return animations
        planets.forEach(function (p) { p.returning = false; });
        if (!speedInterval) {
            speedInterval = setInterval(speedStep, 100);
        }
        if (!animating) {
            animating = true;
            lastTime = 0;
            requestAnimationFrame(tick);
        }
    }

    // When interaction stops, start ease-out return to initial angle.
    // Duration is derived from current speed so the easing starts at
    // exactly the current velocity (no speed-up).
    // For ease-out cubic f(t) = 1-(1-t)^3, f'(0) = 3, so
    // initial angular velocity = 3 * totalAngle / duration.
    // Setting that equal to currentSpeed: duration = 3 * totalAngle / currentSpeed.
    function startReturn(timestamp) {
        planets.forEach(function (p) {
            if (p.speed <= 0) {
                p.angle = p.initialAngle;
                return;
            }
            var from = p.angle;
            // Signed distance to initialAngle in travel direction
            var diff = (p.initialAngle - from) * p.dir;
            // Wrap to positive
            diff = ((diff % TWO_PI) + TWO_PI) % TWO_PI;
            // Add full revolutions so the coast looks natural
            diff += TWO_PI;
            // Compute duration to match current speed at t=0
            var totalAngle = diff; // unsigned distance
            var currentSpeed = p.speed; // unsigned angular speed
            var duration = 3 * totalAngle / currentSpeed;
            // Clamp so it doesn't take forever or be too abrupt
            duration = Math.max(1, Math.min(duration, 6));

            p.returnFrom = from;
            p.returnTo = from + diff * p.dir;
            p.returnStart = timestamp;
            p.returnDuration = duration;
            p.returning = true;
            p.speed = 0;
        });
    }

    function stopAnimation() {
        hovering = false;
        clearInterval(speedInterval);
        speedInterval = null;
        // Use current timestamp for return start
        requestAnimationFrame(function (ts) {
            startReturn(ts);
        });
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
