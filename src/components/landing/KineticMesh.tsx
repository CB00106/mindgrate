import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    originX: number;
    originY: number;
    size: number;
}

const KineticMesh: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: -1000, y: -1000 });
    const animationFrameId = useRef<number>();

    // Configuración visual
    const PARTICLE_COUNT = 1000; // Cantidad de puntos
    const CONNECTION_DISTANCE = 100; // Distancia para dibujar líneas
    const MOUSE_RANGE = 300; // Radio de influencia del mouse
    const ATTRACTION_FORCE = 0.05; // Fuerza de atracción al mouse
    const RETURN_FORCE = 0.03; // Fuerza para volver a la posición original
    const FRICTION = 0.90; // Suavizado de movimiento

    // Inicializar partículas en forma de Hexágono Hueco (Anillo)
    const initParticles = (width: number, height: number) => {
        particles.current = [];
        const centerX = width / 2;
        const centerY = height / 2;

        // Definir el tamaño del anillo/hexágono.
        // Usamos la dimensión más pequeña de la pantalla para asegurar que quepa.
        const minDimension = Math.min(width, height);

        // Radio exterior: qué tan grande es la red.
        const hexOuterRadius = minDimension * 0.70;
        // Radio interior: el tamaño del "hueco" para el texto.
        const hexInnerRadius = minDimension * 0.40;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Generar puntos usando coordenadas polares para crear un anillo
            const theta = Math.random() * 2 * Math.PI; // Ángulo aleatorio alrededor del centro

            // Radio aleatorio que cae ENTRE el radio interior y el exterior
            // Esto es lo que crea el efecto de "hueco"
            const r = hexInnerRadius + Math.random() * (hexOuterRadius - hexInnerRadius);

            // Convertir polar a cartesiano (x, y)
            const x = centerX + r * Math.cos(theta);
            const y = centerY + r * Math.sin(theta);

            particles.current.push({
                x: x,
                y: y,
                originX: x, // Su "hogar" es esta posición en el anillo
                originY: y,
                vx: 0,
                vy: 0,
                size: Math.random() * 2 + 1,
            });
        }
    };

    const animate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Color de los puntos y líneas (Mindgrate Blue con transparencia)
        ctx.fillStyle = '#2383e2';
        ctx.strokeStyle = 'rgba(35, 131, 226, 0.15)';

        particles.current.forEach((p, i) => {
            // 1. Física de atracción al Mouse (Imán)
            const dx = mouse.current.x - p.x;
            const dy = mouse.current.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MOUSE_RANGE) {
                // Cuanto más cerca, más fuerte la atracción
                const force = (1 - distance / MOUSE_RANGE) * ATTRACTION_FORCE;
                p.vx += dx * force;
                p.vy += dy * force;
            }

            // 2. Física de retorno a la posición original (El anillo hexagonal)
            const homeDx = p.originX - p.x;
            const homeDy = p.originY - p.y;
            p.vx += homeDx * RETURN_FORCE;
            p.vy += homeDy * RETURN_FORCE;

            // 3. Aplicar fricción y actualizar posición
            p.vx *= FRICTION;
            p.vy *= FRICTION;
            p.x += p.vx;
            p.y += p.vy;

            // 4. Dibujar partícula
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // 5. Dibujar conexiones
            for (let j = i + 1; j < particles.current.length; j++) {
                const p2 = particles.current[j];
                const dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);

                if (dist < CONNECTION_DISTANCE) {
                    ctx.beginPath();
                    // Líneas más transparentes cuanto más lejos están los puntos
                    ctx.strokeStyle = `rgba(35, 131, 226, ${0.2 * (1 - dist / CONNECTION_DISTANCE)})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });

        animationFrameId.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                canvasRef.current.width = offsetWidth;
                canvasRef.current.height = offsetHeight;
                initParticles(offsetWidth, offsetHeight);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                mouse.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }
        };

        const handleMouseLeave = () => {
            mouse.current = { x: -1000, y: -1000 };
        };

        window.addEventListener('resize', handleResize);
        if (containerRef.current) {
            containerRef.current.addEventListener('mousemove', handleMouseMove);
            containerRef.current.addEventListener('mouseleave', handleMouseLeave);
        }

        handleResize(); // Init
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current) {
                containerRef.current.removeEventListener('mousemove', handleMouseMove);
                containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
};

export default KineticMesh;