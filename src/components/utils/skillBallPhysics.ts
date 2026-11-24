export type SkillBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  spin: number;
};

type Point = { x: number; y: number };

export function layoutBalls(names: string[], width: number, height: number): SkillBall[] {
  const columns = Math.max(1, Math.round(Math.sqrt(names.length * width / height)));
  const rows = Math.ceil(names.length / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const cellSize = Math.min(cellWidth, cellHeight);
  return names.map((name, i) => {
    const angle = i * 2.39996 + 0.62;
    const size = name.length > 15 ? 0.96 : 0.79 + 0.15 * (0.5 + 0.5 * Math.cos(angle));
    const speed = cellSize * (0.56 + 0.19 * Math.sin(i + 0.5));
    return {
      x: (i % columns + 0.5) * cellWidth,
      y: (Math.floor(i / columns) + 0.5) * cellHeight,
      angle,
      spin: 0.45 * Math.cos(angle),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: size * cellSize / 2,
    };
  });
}

// Resolve contact along its normal. A larger ball has more mass and recoils less.
function collide(a: SkillBall, b: SkillBall) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const diameter = a.radius + b.radius;
  if (distanceSquared >= diameter * diameter) return;
  const distance = Math.sqrt(distanceSquared);
  const nx = distance ? dx / distance : 1;
  const ny = distance ? dy / distance : 0;
  const aShare = b.radius ** 2 / (a.radius ** 2 + b.radius ** 2);
  const bShare = 1 - aShare;
  const overlap = diameter - distance;
  a.x -= overlap * nx * aShare;
  a.y -= overlap * ny * aShare;
  b.x += overlap * nx * bShare;
  b.y += overlap * ny * bShare;

  const closingSpeed = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (closingSpeed <= 0) return;
  // The contact points slip past one another in a glancing hit, spinning both balls.
  const slip = (a.vy - b.vy) * nx - (a.vx - b.vx) * ny
    + a.spin * a.radius + b.spin * b.radius;
  const friction = Math.sign(slip) * Math.min(Math.abs(slip) / 3, closingSpeed * 0.16);
  a.vx += friction * ny * aShare;
  a.vy -= friction * nx * aShare;
  b.vx -= friction * ny * bShare;
  b.vy += friction * nx * bShare;
  a.spin -= 2 * friction * aShare / a.radius;
  b.spin -= 2 * friction * bShare / b.radius;

  const impulse = 1.97 * closingSpeed;
  a.vx -= impulse * nx * aShare;
  a.vy -= impulse * ny * aShare;
  b.vx += impulse * nx * bShare;
  b.vy += impulse * ny * bShare;
}

export function stepBalls(balls: SkillBall[], width: number, height: number, dt: number, pointer?: Point) {
  for (const ball of balls) {
    // A soft pull keeps the field together. Restore cruising speed gradually after impacts.
    ball.vx += (width / 2 - ball.x) * 0.14 * dt;
    ball.vy += (height / 2 - ball.y) * 0.14 * dt;
    if (pointer) {
      const dx = ball.x - pointer.x;
      const dy = ball.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      // Include the visible cursor halo in the contact radius.
      if (distance < ball.radius + 25) {
        const nx = distance > 0 ? dx / distance : Math.cos(ball.angle);
        const ny = distance > 0 ? dy / distance : Math.sin(ball.angle);
        const outwardSpeed = ball.vx * nx + ball.vy * ny;
        const kick = Math.max(0, ball.radius * 7 - outwardSpeed);
        ball.vx += kick * nx;
        ball.vy += kick * ny;
      }
    }
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 0) {
      const target = ball.radius * 1.8;
      const scale = Math.min(1 + (target / speed - 1) * 1.2 * dt, 4 * target / speed);
      ball.vx *= scale;
      ball.vy *= scale;
    }
    ball.spin *= Math.exp(-0.22 * dt);
    ball.angle += ball.spin * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
  }
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) collide(balls[i], balls[j]);
  }
  for (const ball of balls) {
    const r = ball.radius;
    if (ball.x < r) { ball.x = r; ball.vx = Math.abs(ball.vx); }
    if (ball.x > width - r) { ball.x = width - r; ball.vx = -Math.abs(ball.vx); }
    if (ball.y < r) { ball.y = r; ball.vy = Math.abs(ball.vy); }
    if (ball.y > height - r) { ball.y = height - r; ball.vy = -Math.abs(ball.vy); }
  }
}
