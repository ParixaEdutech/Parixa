import React, { useRef, useEffect } from 'react';

const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

// Enhanced deep space: nebula clouds + dense starfield + vivid shooting stars + mouse interaction
const fragmentShaderSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec2 iMouse;

    #define NUM_METEORS 15.0
    #define PI 3.14159265

    float hash(float n) {
        return fract(sin(n) * 43758.5453);
    }

    float hash2(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // Smooth noise
    float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash2(i);
        float b = hash2(i + vec2(1.0, 0.0));
        float c = hash2(i + vec2(0.0, 1.0));
        float d = hash2(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Fractal brownian motion for nebula
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        for (int i = 0; i < 5; i++) {
            v += a * vnoise(p);
            p = rot * p * 2.0;
            a *= 0.5;
        }
        return v;
    }

    // Layered star field with multiple densities
    float starLayer(vec2 uv, float scale, float seed) {
        vec2 gv = fract(uv * scale) - 0.5;
        vec2 id = floor(uv * scale);
        float star = 0.0;
        // Check neighbors for smooth edges
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                vec2 offs = vec2(float(x), float(y));
                vec2 cid = id + offs;
                float h = hash2(cid + seed);
                if (h > 0.85) { // density control
                    vec2 p = offs + vec2(hash2(cid + seed + 10.0), hash2(cid + seed + 20.0)) - 0.5 - gv;
                    float d = length(p);
                    float brightness = hash2(cid + seed + 30.0);
                    // Twinkle
                    brightness *= 0.5 + 0.5 * sin(iTime * (1.5 + hash2(cid + seed + 40.0) * 4.0) + h * 6.28);
                    float size = 0.02 + hash2(cid + seed + 50.0) * 0.03;
                    // Cross/sparkle shape for bright stars
                    float sparkle = 1.0;
                    if (brightness > 0.7) {
                        float angle = atan(p.y, p.x);
                        sparkle = 1.0 + 0.5 * pow(abs(sin(angle * 2.0)), 8.0);
                    }
                    star += brightness * smoothstep(size, 0.0, d / sparkle) * 1.2;
                }
            }
        }
        return star;
    }

    // Single meteor with glowing trail and sparks
    float meteor(vec2 uv, float seed, out vec3 mColor) {
        float h1 = hash(seed * 17.31);
        float h2 = hash(seed * 23.17);
        float h3 = hash(seed * 31.73);
        float h4 = hash(seed * 41.37);
        float h5 = hash(seed * 53.91);

        float period = 4.0 + h4 * 6.0;
        float phase = mod(iTime * (0.8 + h5 * 0.4) + h3 * period, period);
        float life = phase / period;

        mColor = vec3(0.0);
        if (life > 0.5) return 0.0;
        float t = life / 0.5;

        // Start position — from upper parts of screen, varied angles
        vec2 start = vec2(-0.1 + h1 * 1.2, 0.8 + h2 * 0.3);
        float angle = -0.3 - h3 * 0.8;
        vec2 dir = vec2(cos(angle), sin(angle));

        float speed = 1.0 + h2 * 0.8;
        vec2 head = start + dir * t * speed;

        // Trail
        float trailLen = 0.12 + h1 * 0.15;
        vec2 tail = head - dir * trailLen;

        // Distance from uv to line segment
        vec2 pa = uv - tail;
        vec2 ba = head - tail;
        float hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float d = length(pa - ba * hh);

        // Tapered thickness
        float thickness = mix(0.0005, 0.003, hh);
        float trail = smoothstep(thickness * 1.5, 0.0, d) * pow(hh, 0.5);

        // Bright head glow
        float headDist = length(uv - head);
        float headGlow = exp(-headDist * headDist * 15000.0) * 3.0;
        float headFlare = exp(-headDist * 80.0) * 0.3;

        // Fade
        float fade = smoothstep(0.0, 0.08, t) * smoothstep(0.5, 0.3, t);

        // Color: white-blue head, warm orange-gold tail
        vec3 headCol = vec3(0.8, 0.9, 1.0);
        vec3 tailCol = vec3(1.0, 0.6, 0.2);
        mColor = mix(tailCol, headCol, hh);

        return (trail + headGlow + headFlare) * fade;
    }

    void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec2 mouse = iMouse.xy / iResolution.xy;

        float t = iTime;

        // Deep space background
        vec3 col = mix(
            vec3(0.0, 0.0, 0.015),
            vec3(0.015, 0.005, 0.04),
            uv.y * uv.y
        );

        // Nebula clouds — colored gas clouds
        vec2 nebUv = uv * 3.0;
        float neb1 = fbm(nebUv + t * 0.03);
        float neb2 = fbm(nebUv * 1.2 + vec2(5.0, 3.0) - t * 0.02);
        float neb3 = fbm(nebUv * 0.8 + vec2(10.0, 7.0) + t * 0.015);

        // Nebula colors — deep purple, teal, soft pink
        vec3 nebCol  = vec3(0.15, 0.03, 0.25) * smoothstep(0.35, 0.7, neb1) * 0.35;
        nebCol      += vec3(0.02, 0.12, 0.18) * smoothstep(0.4, 0.75, neb2) * 0.3;
        nebCol      += vec3(0.18, 0.04, 0.10) * smoothstep(0.45, 0.8, neb3) * 0.2;
        col += nebCol;

        // Multi-layer star field (near and far stars)
        float stars = 0.0;
        stars += starLayer(uv, 30.0, 0.0) * 0.6;    // distant faint
        stars += starLayer(uv, 15.0, 100.0) * 0.8;   // mid
        stars += starLayer(uv, 8.0, 200.0) * 1.0;    // close bright

        // Star color — slight blue-white tint
        vec3 starCol = mix(vec3(0.8, 0.85, 1.0), vec3(1.0, 0.95, 0.85), hash2(floor(uv * 15.0)));
        col += starCol * stars;

        // Mouse interaction: constellation glow
        float mouseDist = length(uv - mouse);
        float mouseGlow = exp(-mouseDist * mouseDist * 8.0) * 0.2;
        col += mouseGlow * vec3(0.15, 0.3, 0.55);

        // Stars near cursor brighten significantly
        float nearMouse = smoothstep(0.25, 0.0, mouseDist);
        col += starCol * stars * nearMouse * 0.8;

        // Mouse ripple ring
        float ripple = abs(mouseDist - 0.15);
        float ring = smoothstep(0.008, 0.0, ripple) * 0.15;
        col += ring * vec3(0.2, 0.4, 0.7);

        // Shooting stars
        for (float i = 0.0; i < NUM_METEORS; i++) {
            vec3 mCol;
            float m = meteor(uv, i + 1.0, mCol);
            col += mCol * m;
        }

        // Vignette — strong cinematic framing
        float vig = 1.0 - dot(uv - 0.5, (uv - 0.5) * 1.8);
        col *= clamp(vig, 0.0, 1.0);

        // Subtle film grain
        float grain = (hash2(uv * iResolution.xy + t) - 0.5) * 0.02;
        col += grain;

        gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
`;

const BackgroundCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl');
        if (!gl) return;

        const compileShader = (source, type) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error(gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        };

        const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
        const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,  1, -1, -1,  1,
            -1,  1,  1, -1,  1,  1,
        ]), gl.STATIC_DRAW);

        const posAttr = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(posAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

        const resLoc   = gl.getUniformLocation(program, "iResolution");
        const timeLoc  = gl.getUniformLocation(program, "iTime");
        const mouseLoc = gl.getUniformLocation(program, "iMouse");

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let targetX = mouseX, targetY = mouseY;

        const handleMouseMove = (e) => {
            targetX = e.clientX;
            targetY = window.innerHeight - e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const resize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        window.addEventListener('resize', resize);
        resize();

        const startTime = Date.now();
        let rafId;

        const render = () => {
            mouseX += (targetX - mouseX) * 0.04;
            mouseY += (targetY - mouseY) * 0.04;

            gl.uniform2f(resLoc, canvas.width, canvas.height);
            gl.uniform1f(timeLoc, (Date.now() - startTime) / 1000.0);
            gl.uniform2f(mouseLoc, mouseX, mouseY);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            rafId = requestAnimationFrame(render);
        };
        render();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafId);
            gl.deleteProgram(program);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full -z-10"
            style={{ display: 'block' }}
        />
    );
};

export default BackgroundCanvas;
