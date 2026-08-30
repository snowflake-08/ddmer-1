"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfigValue, useConfigJson } from "@/components/providers/SiteConfigProvider";
import { siteConfig } from "@/siteConfig";

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
  // 初始状态直接强制显示欢迎密码页，没有任何本地缓存跳过逻辑
  const [show, setShow] = useState(true);
  const [pwdInput, setPwdInput] = useState("");
  const [showPwdError, setShowPwdError] = useState(false);
  const [showPwdSuccess, setShowPwdSuccess] = useState(false);
  const [showWelcomeText, setShowWelcomeText] = useState(false);
  const [showPhoneActionModal, setShowPhoneActionModal] = useState(false);
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const authorName = useConfigValue("authorName", siteConfig.authorName);
  const bgImages = useConfigJson<string[]>("bgImages", siteConfig.bgImages);
  const CORRECT_PWD = "0615";
  const PHONE_NUM = "15636176689";
  const EMAIL_ADDR = "180877972@qq.com";


  // 完全删掉localStorage记住密码的逻辑，每次打开页面都强制显示密码页
  const handlePwdVerify = () => {
    if(pwdInput === CORRECT_PWD) {
      // 第一步：先显示绿色成功提示
      setShowPwdSuccess(true);
      localStorage.setItem('site_auth_expire', (Date.now() + 24 * 60 * 60 * 1000).toString())
      // 第二步：间隔0.8秒后用动画弹出"欢迎！👋"
      setTimeout(() => {
        setShowWelcomeText(true);
      }, 800);
      // 第三步：总时长1.8秒后再执行淡出动画进入主站，节奏自然不仓促
      setTimeout(() => {
        setShow(false);
      }, 1800);
    } else {
      setShowPwdError(true);
      setPwdInput("");
    }
  }

  // 点击电话图标：弹出自定义双选项弹窗
  const handlePhoneClick = () => {
    setShowPhoneActionModal(true);
  }

  // 复制手机号功能，全浏览器兼容
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_NUM);
      alert(`手机号 ${PHONE_NUM} 已成功复制到剪贴板`);
    } catch (e) {
      // 低版本浏览器兼容降级方案
      const input = document.createElement('input');
      input.value = PHONE_NUM;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert(`手机号 ${PHONE_NUM} 已成功复制到剪贴板`);
    }
    setShowPhoneActionModal(false);
  }

  // 系统级原生唤起拨号App，完全跳过浏览器中转
  const handleCallPhone = () => {
    window.location.href = `tel:${PHONE_NUM}`;
    setShowPhoneActionModal(false);
  }

  // 点击邮箱图标：拦截默认跳转，弹出确认弹窗
  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowEmailConfirmModal(true);
  }

  // 确认发送邮件：系统级原生唤起邮件App，完全跳过浏览器中转
  const handleConfirmSendEmail = () => {
    window.location.href = `mailto:${EMAIL_ADDR}`;
    setShowEmailConfirmModal(false);
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
          {/* 背景层 */}
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

          {/* 主内容区域 */}
          <div className="relative z-10 text-center px-6">
            {/* 欢迎来到 入场动画 */}
            <motion.p
              className="text-lg md:text-xl text-slate-400 mb-4 tracking-[0.3em]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              欢迎来到
            </motion.p>

            {/* 站名 入场动画 */}
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

            {/* 时间问候 入场动画 */}
            <motion.p
              className="text-sm md:text-base text-slate-500 tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
            >
              {getTimeGreeting()}
            </motion.p>

            {/* 装饰线 入场动画 */}
            <motion.div
              className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
            />

            {/* 密码输入区域 */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2.6, duration: 0.6 }}
            >
              <p className="text-sm text-slate-400 mb-4">看看你还记不记得我的生日😉：月+日
                （只是用于限流，已经添加我的可以去我的朋友圈置顶查看哦🌹）</p>
              <input
                type="password"
                maxLength={4}
                value={pwdInput}
                onChange={(e) => {
                  setPwdInput(e.target.value);
                  // 输入新内容时自动清空所有提示状态
                  setShowPwdError(false);
                  setShowPwdSuccess(false);
                  setShowWelcomeText(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePwdVerify()}
                placeholder="如:0101"
                className="w-64 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-center text-xl tracking-[0.8em] text-white outline-none focus:border-sky-400"
                style={{ WebkitTextSecurity: "disc" }}
              />

              {/* 陌生人联系模块，和输入框同步依次入场 */}
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 2.9, duration: 0.5 }}
              >
                <p className="text-xs text-slate-400 mb-3">如果您还未添加我，可以点击下方手机或邮箱留言哦！</p>
                <div className="flex items-center justify-center space-x-6">
                  {/* 电话图标 */}
                  <button
                    onClick={handlePhoneClick}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                    title="点击选择复制或拨打"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </button>
                  {/* 邮箱图标 */}
                  <a
                    href={`mailto:${EMAIL_ADDR}`}
                    onClick={handleEmailClick}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                    title="点击发送邮件"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </a>
                </div>
              </motion.div>

              {/* 生日错误提示 弹性回弹动画 */}
              <AnimatePresence>
                {showPwdError && (
                  <motion.p
                    className="mt-4 text-red-400 text-sm"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15,
                      duration: 0.5 
                    }}
                  >
                    ❌生日错误，快去我朋友圈置顶💢
                  </motion.p>
                )}
              </AnimatePresence>
              {/* 密码正确成功提示 弹性回弹动画 */}
              <AnimatePresence>
                {showPwdSuccess && (
                  <motion.p
                    className="mt-4 text-green-400 text-sm"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15,
                      duration: 0.5 
                    }}
                  >
                    🌹谢谢你还记得我的生日😊
                  </motion.p>
                )}
              </AnimatePresence>
              {/* 欢迎文字提示 弹性回弹动画 */}
              <AnimatePresence>
                {showWelcomeText && (
                  <motion.p
                    className="mt-2 text-green-300 text-base font-medium"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 15,
                      duration: 0.5 
                    }}
                  >
                    😘 欢迎！👋
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 电话操作双选项弹窗 */}
          <AnimatePresence>
            {showPhoneActionModal && (
              <>
                <motion.div
                  className="absolute inset-0 bg-black/60 z-[100000]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPhoneActionModal(false)}
                />
                <motion.div
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100001] w-72 bg-slate-900 border border-white/10 rounded-2xl p-6 text-center"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20,
                    duration: 0.4 
                  }}
                >
                  <p className="text-white text-base mb-1">手机号</p>
                  <p className="text-sky-400 text-lg font-medium mb-6">{PHONE_NUM}</p>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleCopyPhone}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors duration-200"
                    >
                      复制
                    </button>
                    <button
                      onClick={handleCallPhone}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors duration-200"
                    >
                      拨打
                    </button>
                    <button
                      onClick={() => setShowPhoneActionModal(false)}
                      className="w-full py-2 text-slate-400 text-sm mt-1"
                    >
                      取消
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* 邮件确认弹窗 */}
          <AnimatePresence>
            {showEmailConfirmModal && (
              <>
                <motion.div
                  className="absolute inset-0 bg-black/60 z-[100000]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowEmailConfirmModal(false)}
                />
                <motion.div
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100001] w-72 bg-slate-900 border border-white/10 rounded-2xl p-6 text-center"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20,
                    duration: 0.4 
                  }}
                >
                  <p className="text-white text-base mb-2">是否要发送邮件给：</p>
                  <p className="text-sky-400 text-lg font-medium mb-6">{EMAIL_ADDR}？</p>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={handleConfirmSendEmail}
                      className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors duration-200"
                    >
                      是
                    </button>
                    <button
                      onClick={() => setShowEmailConfirmModal(false)}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors duration-200"
                    >
                      否
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
