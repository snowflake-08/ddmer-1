"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfigValue, useConfigJson } from "@/components/providers/SiteConfigProvider";
import { siteConfig } from "@/siteConfig";

const SESSION_KEY = "welcome-shown";
const PWD_AUTH_KEY = "siteAuth";

function getTimeGreeting() {
  const now = new Date();
  const h = now.getHours();
  const period = h < 6 ? "凌晨" : h < 9 ? "早上" : h < 12 ? "上午" : h < 14 ? "中午" : h < 18 ? "下午" : "晚上";
  const hour = h <= 12 ? h : h - 12;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const min = now.getMinutes();
  return `${now.getFullYear()}年${m}月${d}日${period}${hour}点${min > 0 ? min + "分" : ""}，很高兴与你相遇`;
}

export default function WelcomeScreen() {
  const [show, setShow] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [showPwdError, setShowPwdError] = useState(false);
  const authorName = useConfigValue("authorName", siteConfig.authorName);
  const bgImages = useConfigJson<string[]>("bgImages", siteConfig.bgImages);
  const CORRECT_PWD = "0615";

  useEffect(() => {
    // 已经验证过密码的用户直接跳过欢迎页
    if(localStorage.getItem(PWD_AUTH_KEY) === "passed") {
      return
    }
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setShow(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, []);

  // 密码验证逻辑
  const handlePwdVerify = () => {
    if(pwdInput === CORRECT_PWD) {
      localStorage.setItem(PWD_AUTH_KEY, "passed")
      setShow(false)
    } else {
      setShowPwdError(true)
      setPwdInput("")
    }
  }

  const bgImage = bgImages[0] || siteConfig.bgImages[0];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1, pointerEvents: "auto" }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* 背景 */}
          <motion.div
            className="absolute inset-0 bg-slate-950"
            exit={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
            }}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 1.2 }}
          />

          {/* 内容 */}
          <div className="relative z-10 text-center px-6">
            {/* 欢迎来到 */}
            <motion.p
              className="text-lg md:text-xl text-slate-400 mb-4 tracking-[0.3em]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              欢迎来到
            </motion.p>

            {/* 站名 */}
            <motion.div
              className="flex items-center justify-center space-x-1 mb-4"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
            >
              <span
                className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {authorName}
              </span>
              <span
                className="text-4xl md:text-5xl font-bold text-sky-400"
                style={{ fontFamily: "serif" }}
              >
                の
              </span>
              <span
                className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                小站
              </span>
            </motion.div>

            {/* 时间问候 */}
            <motion.p
              className="text-sm md:text-base text-slate-500 tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              {getTimeGreeting()}
            </motion.p>

            {/* 装饰线 */}
            <motion.div
              className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            />

            {/* 生日密码提示+输入框 */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2.6, duration: 0.6 }}
            >
              <p className="text-sm text-slate-400 mb-4">请输入我的四位生日以访问小站：</p>
              <input
                type="password"
                maxLength={4}
                value={pwdInput}
                onChange={(e) => setPwdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePwdVerify()}
                placeholder="四位生日"
                className="w-64 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-center text-xl tracking-[0.8em] text-white outline-none focus:border-sky-400"
                style={{ WebkitTextSecurity: "disc" }}
              />
              {showPwdError && <p className="mt-3 text-red-400 text-sm">密码错误，请重新输入</p>}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
