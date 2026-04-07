"use client";

import { createContext, useContext, useState, useCallback } from "react";
import ReportModal from "@/components/ReportModal/ReportModal";

const ReportModalContext = createContext(null);


export const useReportModal = () => {
  const context = useContext(ReportModalContext);
  if (!context) {
    throw new Error("useReportModal must be used within a ReportModalProvider");
  }
  return context;
};

export const ReportModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState(null);       // "POST" | "MEMBER"
  const [targetId, setTargetId] = useState(null); // postId or memberId
  const [targetName, setTargetName] = useState("");

  const openReportModal = useCallback(({ type, targetId, targetName = "" }) => {
    setType(type);
    setTargetId(targetId);
    setTargetName(targetName);
    setIsOpen(true);
  }, []);

  const closeReportModal = useCallback(() => {
    setIsOpen(false);
    setType(null);
    setTargetId(null);
    setTargetName("");
  }, []);

  return (
    <ReportModalContext.Provider value={{ openReportModal, closeReportModal }}>
      {children}
      <ReportModal
        isOpen={isOpen}
        onClose={closeReportModal}
        type={type}
        targetId={targetId}
        targetName={targetName}
      />
    </ReportModalContext.Provider>
  );
};
