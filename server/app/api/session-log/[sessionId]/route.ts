import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Session Log API
 * 
 * GET /api/session-log/[sessionId]
 * Returns the session log in JSON and markdown formats
 * 
 * GET /api/session-log/[sessionId]/download
 * Returns the markdown file as a download
 */

const LOGS_DIR = path.join(process.cwd(), 'logs', 'agent-sessions');

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Check if this is a download request
    const url = new URL(request.url);
    const isDownload = url.pathname.endsWith('/download');
    
    // Construct file paths
    const jsonPath = path.join(LOGS_DIR, `${sessionId}.json`);
    const markdownPath = path.join(LOGS_DIR, `${sessionId}.md`);
    
    // Check if files exist
    try {
      await fs.access(jsonPath);
    } catch (error) {
      return NextResponse.json(
        { error: 'Session log not found' },
        { status: 404 }
      );
    }
    
    if (isDownload) {
      // Return markdown file as download
      try {
        const markdownContent = await fs.readFile(markdownPath, 'utf8');
        
        return new Response(markdownContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="${sessionId}.md"`,
          },
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Markdown file not found' },
          { status: 404 }
        );
      }
    } else {
      // Return both JSON and markdown
      const jsonContent = await fs.readFile(jsonPath, 'utf8');
      const sessionLog = JSON.parse(jsonContent);
      
      let markdown = '';
      try {
        markdown = await fs.readFile(markdownPath, 'utf8');
      } catch (error) {
        // Markdown file might not exist yet
        console.warn('Markdown file not found for session:', sessionId);
      }
      
      return NextResponse.json({
        json: sessionLog,
        markdown,
        sessionId,
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
  } catch (error) {
    console.error('Session log API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
}

