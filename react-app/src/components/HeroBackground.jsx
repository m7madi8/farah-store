/**
 * HeroBackground — WebGL animated gradient background for the hero section.
 * Uses raw WebGL (no OGL dependency). Full-screen quad + fragment shader.
 */

import { useEffect, useRef } from 'react';

const vertexSrc = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentSrc = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    /* Faster base motion + stronger diagonal sweep */
    float t = uTime * 2.35;
    float angle = 0.42 + sin(t * 1.12) * 0.44;
    float s = uv.x * cos(angle) + uv.y * sin(angle);
    s = s * 0.5 + 0.5;
    /* Moving ripples so bands shift visibly across the hero */
    s += sin(uTime * 1.7 + uv.x * 6.28318) * 0.15;
    s += cos(uTime * 1.35 - uv.y * 5.5) * 0.11;
    s = clamp(s, 0.0, 1.0);

    vec3 c1 = vec3(0.176, 0.102, 0.239);
    vec3 c2 = vec3(0.294, 0.165, 0.388);
    vec3 c3 = vec3(0.478, 0.361, 0.557);
    vec3 c4 = vec3(0.239, 0.133, 0.310);
    /* Brighter lavender pulse for clearer color swings (still on-brand) */
    vec3 c3b = vec3(0.52, 0.38, 0.62);
    c3 = mix(c3, c3b, 0.5 + 0.5 * sin(uTime * 2.5));

    float darkEnd = 0.68 + sin(uTime * 2.05) * 0.11;
    float e0 = 0.35 + 0.07 * sin(uTime * 2.15);
    vec3 col = mix(c1, c2, smoothstep(0.0, e0, s));
    col = mix(col, c4, smoothstep(e0 - 0.04, darkEnd, s));
    col = mix(col, c3, smoothstep(darkEnd - 0.06, 1.0, s));

    float glow = 1.0 - length(uv - vec2(0.5, 0.85));
    glow = smoothstep(0.0, 0.55, glow) * (0.11 + 0.14 * sin(uTime * 2.85));
    col += vec3(0.95, 0.89, 0.88) * glow;

    vec2 g2c = vec2(0.74 + sin(uTime * 1.45) * 0.2, 0.16 + cos(uTime * 1.15) * 0.14);
    float glow2 = 1.0 - length(uv - g2c);
    glow2 = smoothstep(0.0, 0.52, glow2) * (0.09 + 0.14 * sin(uTime * 2.25));
    col += vec3(0.52, 0.38, 0.62) * glow2;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertSrc, fragSrc) {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// Full-screen quad (two triangles)
const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

export function HeroBackground() {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-ogl-canvas';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
    if (!gl) return;

    const program = createProgram(gl, vertexSrc, fragmentSrc);
    if (!program) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uResolution = gl.getUniformLocation(program, 'uResolution');

    const resize = () => {
      if (!container.parentElement) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    startTimeRef.current = performance.now() / 1000;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    const onReduceMotion = () => {
      reducedMotion = motionQuery.matches;
    };
    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', onReduceMotion);
    } else {
      motionQuery.addListener(onReduceMotion);
    }

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (!container.parentElement) return;
      const elapsed = performance.now() / 1000 - startTimeRef.current;
      /* Fixed phase when reduced motion — readable hero, no drifting gradient */
      const time = reducedMotion ? 1.25 : elapsed;
      gl.clearColor(0.176, 0.102, 0.239, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    animate();

    return () => {
      if (typeof motionQuery.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', onReduceMotion);
      } else {
        motionQuery.removeListener(onReduceMotion);
      }
      rafRef.current && cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (canvas.parentNode) container.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className="hero-bg-ogl" aria-hidden="true" />;
}
