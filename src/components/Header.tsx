import { motion } from 'framer-motion';
import { Cpu, Zap } from 'lucide-react';

export default function Header() {
    return (
        <motion.header
            className="header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            role="banner"
        >
            <div className="header-content">
                <div className="header-logo">
                    <div className="logo-icon" aria-hidden="true">
                        <Cpu size={28} aria-hidden="true" />
                        <Zap size={16} className="logo-zap" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="header-title">
                            <span className="gradient-text">LLM</span> Hardware Calculator
                        </h1>
                        <p className="header-subtitle">Can your machine run it? Find out instantly.</p>
                    </div>
                </div>
                <div className="header-badges" aria-label="Application features">
                    <span className="badge badge-api">API-Powered</span>
                    <span className="badge badge-models">2800+ GPUs</span>
                </div>
            </div>
        </motion.header>
    );
}
