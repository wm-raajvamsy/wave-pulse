'use client';

import React, { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Card, CardBody, CardHeader, Divider } from '@nextui-org/react';

interface SessionDebugProps {
  sessionId?: string;
  logPath?: string;
  answerQuality?: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence?: number;
  issuesDetected?: string[];
}

export const SessionDebug = ({
  sessionId,
  logPath,
  answerQuality,
  confidence,
  issuesDetected = [],
}: SessionDebugProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Quality badge configuration
  const qualityConfig = {
    HIGH: { color: 'success' as const, emoji: '🟢', label: 'High Quality' },
    MEDIUM: { color: 'warning' as const, emoji: '🟡', label: 'Medium Quality' },
    LOW: { color: 'danger' as const, emoji: '🔴', label: 'Low Quality' },
  };
  
  const config = answerQuality ? qualityConfig[answerQuality] : qualityConfig.LOW;
  
  // Fetch session log when modal opens
  const handleViewLog = async () => {
    if (!sessionId) return;
    
    onOpen();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/session-log/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMarkdown(data.markdown || 'No markdown available');
      } else {
        setMarkdown('Failed to load session log');
      }
    } catch (error) {
      setMarkdown('Error loading session log: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Download markdown file
  const handleDownload = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/session-log/${sessionId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sessionId}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };
  
  if (!sessionId) {
    return null; // Don't show anything if no session
  }
  
  return (
    <>
      <Card className="mt-4">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col flex-1">
            <p className="text-sm font-semibold">Session Debug Info</p>
            <p className="text-xs text-default-500">Session ID: {sessionId}</p>
          </div>
          <Chip
            color={config.color}
            size="sm"
            variant="flat"
            startContent={<span>{config.emoji}</span>}
          >
            {config.label}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="flex flex-col gap-2">
            {/* Confidence Score */}
            {confidence !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-default-600">Confidence:</span>
                <span className="text-sm font-semibold">{confidence}%</span>
              </div>
            )}
            
            {/* Issues Detected */}
            {issuesDetected.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-sm text-default-600">Issues Detected ({issuesDetected.length}):</span>
                <ul className="text-xs space-y-1">
                  {issuesDetected.slice(0, 3).map((issue, idx) => (
                    <li key={idx} className="text-danger-500">⚠️ {issue}</li>
                  ))}
                  {issuesDetected.length > 3 && (
                    <li className="text-default-400">...and {issuesDetected.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={handleViewLog}
              >
                View Debug Log
              </Button>
              <Button
                size="sm"
                color="default"
                variant="bordered"
                onPress={handleDownload}
              >
                Download
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Debug Log Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>Session Debug Log</span>
            <span className="text-xs text-default-500">Session: {sessionId}</span>
          </ModalHeader>
          <ModalBody>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-default-100 p-4 rounded-lg overflow-auto">
                {markdown}
              </pre>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" onPress={handleDownload}>
              Download Log
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SessionDebug;

