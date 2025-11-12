"use client";

import React, { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner } from '@nextui-org/react';
import { DeleteIcon } from '@nextui-org/shared-icons';
import { UIAgent } from '@/wavepulse/ui-agent';
import { CALLS } from '@/wavepulse/constants';
import SessionDetails from '@/components/performance/session-details';

interface PerformanceProps {
  agent: UIAgent;
}

export default function PerformanceTab({ agent }: PerformanceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/wavepulse/api/performance/list');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError(err.message);
    }
  };

  const startRecording = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate session ID
      const sessionId = `perf-${agent.channelId}-${Date.now()}`;

      // Start recording on server
      const serverResponse = await fetch('/wavepulse/api/performance/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: agent.channelId,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          }
        })
      });

      const serverData = await serverResponse.json();
      if (!serverData.success) {
        throw new Error(serverData.error || 'Failed to start recording on server');
      }

      // Start recording on agent
      const agentResult = await agent.invoke(CALLS.PERFORMANCE.START_RECORDING, [{
        sessionId: serverData.sessionId
      }]);

      setCurrentSession({
        sessionId: serverData.sessionId,
        startTime: serverData.startTime
      });
      setIsRecording(true);
      
      console.log('Performance recording started:', agentResult);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      setLoading(true);
      setError(null);

      // Stop recording on agent
      await agent.invoke(CALLS.PERFORMANCE.STOP_RECORDING, []);

      // Stop recording on server
      const response = await fetch('/wavepulse/api/performance/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.sessionId
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to stop recording');
      }

      setIsRecording(false);
      setCurrentSession(null);
      
      // Reload sessions list
      await loadSessions();

      console.log('Performance recording stopped');
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError(err.message || 'Failed to stop recording');
    } finally {
      setLoading(false);
    }
  };

  const viewSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/wavepulse/api/performance/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedSession(data.session);
      } else {
        throw new Error(data.error || 'Failed to load session');
      }
    } catch (err: any) {
      console.error('Error viewing session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const response = await fetch(`/wavepulse/api/performance/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        await loadSessions();
      } else {
        throw new Error(data.error || 'Failed to delete session');
      }
    } catch (err: any) {
      console.error('Error deleting session:', err);
      setError(err.message);
    }
  };

  if (selectedSession) {
    return (
      <SessionDetails 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-300 p-2 flex items-center justify-between">
          <span className="text-red-600 text-sm">{error}</span>
          <Button size="sm" variant="light" onPress={() => setError(null)}>✕</Button>
        </div>
      )}

      {/* Recording Controls */}
      <div className="border-b border-gray-300 p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Performance Recording</h3>
        </div>
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <Button 
              size="sm"
              className="bg-green-600 text-white"
              onPress={startRecording}
              isDisabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Start Recording'}
            </Button>
          ) : (
            <>
              <Button 
                size="sm"
                className="bg-red-600 text-white"
                onPress={stopRecording}
                isDisabled={loading}
              >
                {loading ? <Spinner size="sm" /> : 'Stop Recording'}
              </Button>
              <span className="text-red-600 text-sm font-medium">
                ● Recording... ({Math.floor((Date.now() - currentSession.startTime) / 1000)}s)
              </span>
            </>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Record component render performance, state updates, and lifecycle events
        </p>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-auto">
        <div className="border-b border-gray-300 p-3 flex items-center justify-between bg-gray-50">
          <h3 className="text-sm font-semibold">Recorded Sessions</h3>
          <Button size="sm" variant="light" onPress={loadSessions}>
            Refresh
          </Button>
        </div>
        {sessions.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500 text-sm">
              No recorded sessions. Start a recording to capture performance data.
            </p>
          </div>
        ) : (
          <Table 
            aria-label="Performance sessions"
            removeWrapper
            classNames={{
              th: 'bg-gray-100 text-xs font-semibold',
              td: 'text-sm'
            }}
          >
            <TableHeader>
              <TableColumn>SESSION ID</TableColumn>
              <TableColumn>START TIME</TableColumn>
              <TableColumn>DURATION</TableColumn>
              <TableColumn>COMPONENTS</TableColumn>
              <TableColumn>RENDERS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {sessions.map(session => (
                <TableRow key={session.sessionId}>
                  <TableCell>
                    <span className="font-mono text-xs text-gray-600">{session.sessionId.substring(0, 20)}...</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(session.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {session.duration ? `${(session.duration / 1000).toFixed(2)}s` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {session.summary?.totalComponents || 0}
                  </TableCell>
                  <TableCell className="text-xs">
                    {session.summary?.totalRenders || 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="flat"
                        className="text-blue-600"
                        onPress={() => viewSession(session.sessionId)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light"
                        onPress={() => deleteSession(session.sessionId)}
                      >
                        <DeleteIcon/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

