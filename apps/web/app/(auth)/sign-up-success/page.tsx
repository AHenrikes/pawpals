"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { TypographyH2, TypographyP } from "@repo/ui/typography";
import Image from "next/image";

// Use crypto-secure randomness when available; fall back to Math.random.
const secureRandom = () => {
  try {
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      const arr = new Uint32Array(1);
      globalThis.crypto.getRandomValues(arr);
      // Divide by max uint32 to get [0, 1)
      return (arr[0] ?? 0) / 0xffffffff;
    }
  } catch {
    // Fall through to Math.random()
  }
  return Math.random();
};

const randRange = (min: number, max: number) =>
  min + secureRandom() * (max - min);

const confettiPieces = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: randRange(0, 100),
  delay: randRange(0, 0.6),
  duration: randRange(1.2, 2.0),
  rotate: randRange(0, 360),
  color: ["#7C6FFF", "#4FFFA4", "#FF6B9D", "#FFD166", "#4FC3F7"][
    Math.floor(randRange(0, 5))
  ],
  size: randRange(6, 14),
}));

export default function SignUpSuccess() {
  return (
    <main className="container grid place-content-center h-svh overflow-hidden relative mx-auto">
      {/* Confetti */}
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute pointer-events-none rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: "-5%",
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0],
            rotate: piece.rotate + 360,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}

      {/* Content */}
      <div className="flex flex-col items-center gap-6 z-10">
        <motion.div
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 16,
            delay: 0.1,
          }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }}
          >
            <Image
              src="/images/app/party-popper.png"
              width={160}
              height={160}
              alt="Party popper"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Card with staggered children */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 22,
            delay: 0.35,
          }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <CardHeader className="py-4">
              {/* Eyebrow label */}
              <CardTitle>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: 0.65,
                  }}
                >
                  <TypographyH2>Thank you for signing up!</TypographyH2>
                </motion.div>
              </CardTitle>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 22,
                  delay: 0.8,
                }}
                className="border rounded-xl p-5 space-y-2"
              >
                {/* Envelope icon pulse */}
                <motion.div
                  className="flex justify-center mb-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                    delay: 0.95,
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1.5,
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </motion.div>
                </motion.div>

                <CardDescription className="font-semibold text-sm">
                  Check your email to confirm
                </CardDescription>
                <TypographyP className="text-sm text-muted-foreground leading-relaxed">
                  You&apos;ve successfully signed up. Please check your email to
                  confirm your account before signing in.
                </TypographyP>
              </motion.div>

              {/* Checkmark row */}
              <motion.div
                className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5, ease: "easeOut" }}
                >
                  <motion.path
                    d="M20 6 9 17l-5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.2, duration: 0.45, ease: "easeOut" }}
                  />
                </motion.svg>
                <span>Account created successfully</span>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
