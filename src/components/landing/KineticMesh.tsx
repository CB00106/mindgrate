import React, { useEffect, useRef } from 'react';

interface KineticMeshProps {
    color?: string; // Optional color prop for customization
}

const KineticMesh: React.FC<KineticMeshProps> = ({ color = '#2383e2' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width: number;
        let height: number;
        let particles: Particle[] = [];
        let animationFrameId: number;
        let tick = 0;

        // Estado del mouse
        const mouse = { x: -1000, y: -1000 };

        // Configuración Visual
        const CONFIG = {
            color: color, // Use prop color
            mouseRadius: 200,
            particleBaseSize: 2,
            spacing: 18, // Espaciado base para la espiral
            repulsionStrength: 15,
            springTension: 0.05,
            friction: 0.85,
        };

        class Particle {
            originX: number;
            originY: number;
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            pulseSpeed: number;
            pulseOffset: number;
            colorPhase: number;
            colorSpeed: number;

            constructor(x: number, y: number) {
                this.originX = x;
                this.originY = y;
                this.x = x;
                this.y = y;
                this.vx = 0;
                this.vy = 0;
                // Variación de tamaño para profundidad - AUMENTADO
                this.size = Math.random() * CONFIG.particleBaseSize + 1.5;
                // Configuración para efecto "Breathing"
                this.pulseSpeed = 0.05 + Math.random() * 0.03;
                this.pulseOffset = Math.random() * Math.PI * 2;
                // Configuración para variación de color
                this.colorPhase = Math.random() * Math.PI * 2;
                this.colorSpeed = 0.02 + Math.random() * 0.01;
            }

            update() {
                // 1. FÍSICA DEL MOUSE (Repulsión)
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONFIG.mouseRadius) {
                    const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.cos(angle) * force * CONFIG.repulsionStrength;
                    const pushY = Math.sin(angle) * force * CONFIG.repulsionStrength;

                    this.vx -= pushX;
                    this.vy -= pushY;
                }

                // 2. FÍSICA DE MUELLE (Retorno a origen con movimiento orgánico)
                // El origen oscila ligeramente para dar sensación de "flotación"
                const driftX = Math.sin(tick * 0.01 + this.pulseOffset) * 5;
                const driftY = Math.cos(tick * 0.01 + this.pulseOffset) * 5;

                const targetX = this.originX + driftX;
                const targetY = this.originY + driftY;

                const springX = targetX - this.x;
                const springY = targetY - this.y;

                this.vx += springX * CONFIG.springTension;
                this.vy += springY * CONFIG.springTension;

                // 3. FRICCIÓN
                this.vx *= CONFIG.friction;
                this.vy *= CONFIG.friction;

                // Actualizar posición
                this.x += this.vx;
                this.y += this.vy;
            }

            draw(context: CanvasRenderingContext2D) {
                // Cálculo de Opacidad (Breathing) - BRILLO AUMENTADO
                const alpha = 0.5 + Math.sin(tick * this.pulseSpeed + this.pulseOffset) * 0.4;

                if (alpha <= 0) return;

                // Calcular el color basado en la fase de color
                const colorCycle = (Math.sin(tick * this.colorSpeed + this.colorPhase) + 1) / 2;

                let r, g, b;

                if (colorCycle < 0.33) {
                    // Transición de Azul Metálico a Negro
                    const t = colorCycle / 0.33;
                    r = Math.floor(35 * (1 - t));
                    g = Math.floor(131 * (1 - t));
                    b = Math.floor(226 * (1 - t));
                } else if (colorCycle < 0.66) {
                    // Transición de Negro a Dorado
                    const t = (colorCycle - 0.33) / 0.33;
                    r = Math.floor(212 * t);
                    g = Math.floor(175 * t);
                    b = Math.floor(55 * t);
                } else {
                    // Transición de Dorado a Azul Metálico
                    const t = (colorCycle - 0.66) / 0.34;
                    r = Math.floor(212 * (1 - t) + 35 * t);
                    g = Math.floor(175 * (1 - t) + 131 * t);
                    b = Math.floor(55 * (1 - t) + 226 * t);
                }

                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fillStyle = `rgb(${r}, ${g}, ${b})`;
                context.globalAlpha = alpha;
                context.fill();

                // Agregar un brillo sutil
                context.globalAlpha = alpha * 0.3;
                context.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                context.fillStyle = `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`;
                context.fill();

                context.globalAlpha = 1;
            }
        }

        const createParticles = () => {
            particles = [];
            const centerX = width / 2;
            const centerY = height / 2;
            // Cantidad de partículas relativa al ancho de pantalla
            const count = Math.min(width * 0.8, 800);

            for (let i = 0; i < count; i++) {
                // ALGORITMO PHYLLOTAXIS (Espiral Áurea)
                const angle = i * 137.5 * (Math.PI / 180);
                const r = CONFIG.spacing * Math.sqrt(i);

                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);

                // Solo agregar si está visible (con margen)
                if (x > -50 && x < width + 50 && y > -50 && y < height + 50) {
                    particles.push(new Particle(x, y));
                }
            }
        };

        const handleResize = () => {
            if (canvas.parentElement) {
                width = canvas.width = canvas.parentElement.offsetWidth;
                height = canvas.height = canvas.parentElement.offsetHeight;
                createParticles();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            tick++;

            particles.forEach((p) => {
                p.update();
                p.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Inicialización
        handleResize();
        animate();

        // Event Listeners
        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto z-0"
            style={{ opacity: 1 }} // Ajuste sutil de opacidad general
        />
    );
};

export default KineticMesh;