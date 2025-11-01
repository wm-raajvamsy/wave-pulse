import { Type } from '@google/genai';
import { GeminiToolSchema, ToolExecutionResult } from '../../types';

/**
 * WaveMaker Java service endpoint configuration
 * This can be made configurable via environment variables
 */
const WAVEMAKER_ENDPOINT = process.env.WAVEMAKER_ENDPOINT || 
  'https://www.wavemakeronline.com/run-ngnfytn5tb/t7_master/services/myJava/executeCommand';

/**
 * Execute a command on the WaveMaker Java service
 */
async function executeCommandOnServer(command: string, projectLocation?: string): Promise<string> {
  // Build the full command, changing to project directory first if provided
  let fullCommand = command;
  if (projectLocation) {
    // Remove trailing slash if present for consistency
    const cleanProjectLocation = projectLocation.replace(/\/$/, '');
    // Change to project directory and then execute the command
    // Using cd in the shell command to scope execution
    fullCommand = `cd "${cleanProjectLocation}" && ${command}`;
  }

  // URL encode the command parameter
  const encodedCommand = encodeURIComponent(fullCommand);
  const url = `${WAVEMAKER_ENDPOINT}?command=${encodedCommand}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'skipSecurity': 'true',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.text();
  return result;
}

/**
 * Execute any shell command (generic command execution)
 */
export async function executeCommand(
  command: string,
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!command) {
      return {
        success: false,
        error: 'command is required',
      };
    }

    const output = await executeCommandOnServer(command, projectLocation);

    return {
      success: true,
      data: {
        command,
        output,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Execute echo command
 */
export async function echoCommand(
  text: string,
  options?: {
    noNewline?: boolean;
    enableEscape?: boolean;
  },
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (text === undefined) {
      return {
        success: false,
        error: 'text is required',
      };
    }

    let command = 'echo';
    
    if (options?.enableEscape) {
      command += ' -e';
    }
    
    if (options?.noNewline) {
      command += ' -n';
    }

    // Escape the text properly for shell
    const escapedText = text.replace(/"/g, '\\"');
    command += ` "${escapedText}"`;

    const output = await executeCommandOnServer(command, projectLocation);

    return {
      success: true,
      data: {
        text,
        output,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Execute sed command for text transformation
 */
export async function sedCommand(
  script: string,
  filePath?: string,
  options?: {
    inPlace?: boolean;
    backup?: boolean;
    extendedRegex?: boolean;
  },
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!script) {
      return {
        success: false,
        error: 'script is required (sed script/expression)',
      };
    }

    let command = 'sed';
    
    if (options?.extendedRegex) {
      command += ' -E';
    }
    
    if (options?.inPlace && filePath) {
      if (options?.backup) {
        command += ` -i.bak`;
      } else {
        // macOS sed requires '' for in-place editing
        command += ` -i ''`;
      }
    }

    // Escape the script properly
    const escapedScript = script.replace(/'/g, "'\\''");
    command += ` '${escapedScript}'`;

    if (filePath) {
      command += ` "${filePath}"`;
    }

    const output = await executeCommandOnServer(command, projectLocation);

    return {
      success: true,
      data: {
        script,
        filePath: filePath || 'stdin',
        output: output || 'Command executed successfully',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Read file content
 */
export async function readFile(
  filePath: string,
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!filePath) {
      return {
        success: false,
        error: 'filePath is required',
      };
    }

    // Use cat command to read file
    const command = `cat "${filePath}"`;
    const output = await executeCommandOnServer(command, projectLocation);

    return {
      success: true,
      data: {
        filePath,
        content: output,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Write content to a file (overwrites existing file)
 */
export async function writeFile(
  filePath: string,
  content: string,
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!filePath) {
      return {
        success: false,
        error: 'filePath is required',
      };
    }

    if (content === undefined) {
      return {
        success: false,
        error: 'content is required',
      };
    }

    // Use printf to handle multiline content and special characters
    // Create a temporary heredoc or use printf with proper escaping
    const escapedContent = content.replace(/'/g, "'\\''");
    const command = `printf '%s' '${escapedContent}' > "${filePath}"`;
    const output = await executeCommandOnServer(command, projectLocation);

    return {
      success: true,
      data: {
        filePath,
        message: 'File written successfully',
        output: output || 'Command executed',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Append content to a file
 */
export async function appendToFile(
  filePath: string,
  content: string,
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!filePath) {
      return {
        success: false,
        error: 'filePath is required',
      };
    }

    if (content === undefined) {
      return {
        success: false,
        error: 'content is required',
      };
    }

    const escapedContent = content.replace(/'/g, "'\\''");
    const command = `printf '%s' '${escapedContent}' >> "${filePath}"`;
    const output = await executeCommandOnServer(command, projectLocation);

    return {
      success: true,
      data: {
        filePath,
        message: 'Content appended successfully',
        output: output || 'Command executed',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Search for text pattern in files (grep)
 */
export async function grepFiles(
  pattern: string,
  filePath?: string,
  options?: {
    caseSensitive?: boolean;
    recursive?: boolean;
    includeLineNumbers?: boolean;
  },
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!pattern) {
      return {
        success: false,
        error: 'pattern is required',
      };
    }

    let command = 'grep';
    
    const grepOptions: string[] = [];
    if (!options?.caseSensitive) {
      grepOptions.push('-i');
    }
    if (options?.includeLineNumbers) {
      grepOptions.push('-n');
    }
    if (options?.recursive) {
      grepOptions.push('-r');
    }

    if (grepOptions.length > 0) {
      command += ` ${grepOptions.join(' ')}`;
    }

    const escapedPattern = pattern.replace(/"/g, '\\"');
    command += ` "${escapedPattern}"`;

    if (filePath) {
      command += ` "${filePath}"`;
    } else if (options?.recursive) {
      command += ' .';
    } else {
      return {
        success: false,
        error: 'filePath is required when recursive is false',
      };
    }

    const output = await executeCommandOnServer(command, projectLocation);

    const lines = output.trim().split('\n').filter(line => line.length > 0);

    return {
      success: true,
      data: {
        pattern,
        filePath: filePath || 'current directory',
        matches: lines,
        count: lines.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Find files by name pattern
 */
export async function findFiles(
  namePattern: string,
  directory?: string,
  options?: {
    type?: 'file' | 'directory' | 'both';
    maxDepth?: number;
  },
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!namePattern) {
      return {
        success: false,
        error: 'namePattern is required',
      };
    }

    let command = 'find';
    
    const searchDir = directory || projectLocation || '.';
    command += ` "${searchDir}"`;

    if (options?.maxDepth !== undefined) {
      command += ` -maxdepth ${options.maxDepth}`;
    }

    if (options?.type === 'file') {
      command += ' -type f';
    } else if (options?.type === 'directory') {
      command += ' -type d';
    }

    const escapedPattern = namePattern.replace(/"/g, '\\"');
    command += ` -name "${escapedPattern}"`;

    const output = await executeCommandOnServer(command, projectLocation);

    // Split by newlines and clean each path
    const files = output
      .trim()
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => {
        // Clean the path - remove quotes and escape sequences
        return line
          .trim()
          .replace(/^["']+|["']+$/g, '')  // Remove quotes
          .replace(/\\n/g, '')             // Remove newlines
          .replace(/\\"/g, '"')            // Unescape quotes
          .trim();
      })
      .filter(path => path.length > 0);  // Remove empty paths

    return {
      success: true,
      data: {
        namePattern,
        directory: searchDir,
        files,
        count: files.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * List directory contents
 */
export async function listDirectory(
  directory?: string,
  options?: {
    showHidden?: boolean;
    detailed?: boolean;
  },
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    const targetDir = directory || projectLocation || '.';
    
    let command = 'ls';
    
    if (options?.detailed) {
      command += ' -lh';
    } else {
      command += ' -1';
    }
    
    if (options?.showHidden) {
      command += ' -a';
    }

    command += ` "${targetDir}"`;

    const output = await executeCommandOnServer(command, projectLocation);

    const items = output.trim().split('\n').filter(line => line.length > 0);

    return {
      success: true,
      data: {
        directory: targetDir,
        items,
        count: items.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Edit file by replacing text (simple search and replace)
 */
export async function editFile(
  filePath: string,
  searchText: string,
  replaceText: string,
  projectLocation?: string
): Promise<ToolExecutionResult> {
  try {
    if (!filePath) {
      return {
        success: false,
        error: 'filePath is required',
      };
    }

    if (!searchText) {
      return {
        success: false,
        error: 'searchText is required',
      };
    }

    // Clean the filePath aggressively - handle nested quotes from find_files output
    // Example: "\"/path/to/file\\n\"" should become "/path/to/file"
    // The path from find_files might come as JSON-encoded string with escaped quotes
    let cleanFilePath = filePath
      .trim()
      // Remove all leading/trailing quotes (handle multiple layers like ""path"" or '"path"')
      .replace(/^["']+|["']+$/g, '')
      // Remove escaped newlines (\n in string becomes actual newline, or \\n stays as \n)
      .replace(/\\n/g, '')
      // Handle escaped quotes (\" becomes ")
      .replace(/\\"/g, '"')
      // Handle literal backslash-n sequences that might remain
      .replace(/\\\\n/g, '')
      .trim();
    
    // If the string still looks like it's JSON-encoded (starts with quote), try parsing it
    if ((cleanFilePath.startsWith('"') || cleanFilePath.startsWith("'")) && 
        (cleanFilePath.endsWith('"') || cleanFilePath.endsWith("'"))) {
      try {
        // Try to parse as JSON string
        cleanFilePath = JSON.parse(cleanFilePath);
      } catch {
        // If not valid JSON, just remove quotes again
        cleanFilePath = cleanFilePath.replace(/^["']+|["']+$/g, '');
      }
    }

    // When projectLocation is provided, we cd into that directory first
    // So we should use the relative filePath in the command
    // But for checking existence, we need the full path
    let filePathForCommand = cleanFilePath;
    let filePathForCheck = cleanFilePath;
    let shouldUseProjectLocation = false;
    
    if (projectLocation) {
      // Remove trailing slash from projectLocation if present
      const cleanProjectLocation = projectLocation.replace(/\/$/, '');
      
      // If filePath is absolute, we don't need to cd
      // Just use the absolute path directly
      if (cleanFilePath.startsWith('/')) {
        filePathForCheck = cleanFilePath;
        filePathForCommand = cleanFilePath;
        shouldUseProjectLocation = false; // Don't use cd for absolute paths
      } else {
        // For relative paths, construct full path for checking
        filePathForCheck = `${cleanProjectLocation}/${cleanFilePath}`;
        // But in command, use relative path since we cd into projectLocation
        filePathForCommand = cleanFilePath;
        shouldUseProjectLocation = true; // Use cd for relative paths
      }
    } else {
      // No projectLocation provided - use path as-is (can be absolute or relative)
      filePathForCheck = cleanFilePath;
      filePathForCommand = cleanFilePath;
      shouldUseProjectLocation = false;
    }

    // Check if file exists (use full path for check)
    // Use a more robust check that works regardless of current directory
    const checkCommand = `[ -f "${filePathForCheck}" ] && echo "exists" || echo "notfound"`;
    const checkOutput = await executeCommandOnServer(checkCommand, shouldUseProjectLocation ? projectLocation : undefined);
    
    if (checkOutput.trim() !== 'exists') {
      // Try a more detailed check to see what's wrong
      const lsCommand = `ls -la "${filePathForCheck}" 2>&1 | head -1 || echo "notfound"`;
      const lsOutput = await executeCommandOnServer(lsCommand, shouldUseProjectLocation ? projectLocation : undefined);
      
      // If ls shows the file exists, trust ls over test (might be a test command issue)
      // Clean the ls output - remove quotes, escaped newlines, and extra whitespace
      let lsOutputTrimmed = lsOutput.trim()
        .replace(/^["']+|["']+$/g, '')  // Remove surrounding quotes
        .replace(/\\n/g, '')              // Remove escaped newlines
        .replace(/\n/g, '')               // Remove actual newlines
        .trim();
      
      // Check if ls output shows the file exists (contains file permissions and the path)
      // ls -la output format: "-rw-r--r-- 1 user group size date time /full/path/to/file"
      const hasFilePermissions = lsOutputTrimmed && 
        (lsOutputTrimmed.startsWith('-') || lsOutputTrimmed.startsWith('d') || lsOutputTrimmed.startsWith('l'));
      
      const hasNoError = lsOutputTrimmed && 
        !lsOutputTrimmed.includes('not found') && 
        !lsOutputTrimmed.includes('No such file') && 
        !lsOutputTrimmed.includes('cannot access') &&
        !lsOutputTrimmed.includes('notfound');
      
      // Check if output contains the filename (more reliable than full path)
      const filename = filePathForCheck.split('/').pop() || '';
      const containsFilename = lsOutputTrimmed && filename && lsOutputTrimmed.includes(filename);
      const containsFullPath = lsOutputTrimmed && lsOutputTrimmed.includes(filePathForCheck);
      
      // If ls shows valid file listing, trust it over test command
      if (hasFilePermissions && hasNoError && (containsFilename || containsFullPath)) {
        // File exists according to ls, proceed with edit despite test command failure
        // Continue with edit operation
      } else {
        return {
          success: false,
          error: `File "${filePath}" not found${projectLocation ? ` in project location "${projectLocation}"` : ''}. Cleaned path: "${cleanFilePath}", Full check path: "${filePathForCheck}". LS output: ${lsOutputTrimmed.substring(0, 200)}. Has permissions: ${hasFilePermissions}, No error: ${hasNoError}, Contains filename: ${containsFilename}, Contains full path: ${containsFullPath}`,
        };
      }
    }

    // Use sed to perform search and replace
    // Escape special regex characters in search text
    const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Escape special sed replacement characters
    const escapedReplace = replaceText.replace(/[&\\]/g, (match) => {
      if (match === '&') return '\\&';
      if (match === '\\') return '\\\\';
      return match;
    });

    // Construct sed command with proper quoting
    // Use -e flag for better script handling
    const sedScript = `s/${escapedSearch}/${escapedReplace}/g`;
    
    // sed -i syntax varies:
    // macOS: sed -i '' -e 'script' file (requires empty string for backup extension)
    // Linux: sed -i -e 'script' file (no backup extension needed)
    // 
    // When URL encoded, the space in "sed -i ''" might cause issues
    // Use a portable approach: create a temp file, edit it, then replace original
    // OR use sed without -i and redirect output
    // 
    // Use sed with output redirection which is more portable than sed -i
    // This works on both macOS and Linux without syntax differences
    const tempFile = `${filePathForCommand}.tmp.${Date.now()}`;
    const command = `sed -e '${sedScript}' "${filePathForCommand}" > "${tempFile}" && mv "${tempFile}" "${filePathForCommand}"`;
    
    const output = await executeCommandOnServer(command, shouldUseProjectLocation ? projectLocation : undefined);

    // Check if sed command failed by examining output
    const outputTrimmed = output.trim();
    const outputLower = outputTrimmed.toLowerCase();
    
    // If output contains error messages, the command failed
    // sed errors typically contain "can't read", "no such file", or "sed:"
    if (outputTrimmed && (
        outputLower.includes("can't read") || 
        outputLower.includes("no such file") ||
        (outputLower.includes("sed:") && outputTrimmed.length > 0)
    )) {
      return {
        success: false,
        error: `Failed to edit file: ${outputTrimmed || 'Unknown error'}`,
        data: {
          filePath: filePathForCheck,
          output: outputTrimmed,
        },
      };
    }

    // Verify that the replacement actually happened by checking if the search text exists
    // Use grep with -F for literal string matching (not regex) to avoid escaping issues
    // Escape the search text for shell safety (quote it properly)
    const safeSearchForGrep = searchText.replace(/'/g, "'\"'\"'"); // Escape single quotes in shell
    const verifyCommand = `grep -Fq '${safeSearchForGrep}' "${filePathForCommand}" 2>&1 || echo "notfound"`;
    const verifyOutput = await executeCommandOnServer(verifyCommand, shouldUseProjectLocation ? projectLocation : undefined);
    const verifyTrimmed = verifyOutput.trim();
    
      // If grep found the search text, it means the replacement didn't happen
      if (!verifyTrimmed.includes('notfound') && verifyTrimmed.length > 0) {
        // Check if the replacement text exists instead (use -F for literal matching)
        const safeReplaceForGrep = replaceText.replace(/'/g, "'\"'\"'"); // Escape single quotes in shell
        const checkReplaceCommand = `grep -Fq '${safeReplaceForGrep}' "${filePathForCommand}" 2>&1 || echo "notfound"`;
        const checkReplaceOutput = await executeCommandOnServer(checkReplaceCommand, shouldUseProjectLocation ? projectLocation : undefined);
        const checkReplaceTrimmed = checkReplaceOutput.trim();
        
        // If replacement text is found, replacement succeeded
        if (!checkReplaceTrimmed.includes('notfound') && checkReplaceTrimmed.length > 0) {
          // Check for duplicate attributes (e.g., caption="..." caption="...")
          // Extract attribute name from replaceText if it matches pattern attribute="value"
          const attributeMatch = replaceText.match(/(\w+)="[^"]*"/);
          if (attributeMatch) {
            const attrName = attributeMatch[1];
            // Count how many times this attribute appears in the file (simple count)
            const countCommand = `grep -o '${attrName}="[^"]*"' "${filePathForCommand}" 2>&1 | wc -l || echo "0"`;
            const countOutput = await executeCommandOnServer(countCommand, shouldUseProjectLocation ? projectLocation : undefined);
            const count = parseInt(countOutput.trim(), 10) || 0;
            
            // If count is > 1, check if they're on the same line (which would be a duplicate)
            if (count > 1) {
              // Check for duplicates on the same line (most common case)
              const sameLineDuplicateCheck = await executeCommandOnServer(
                `grep -n '${attrName}="[^"]*".*${attrName}="[^"]*"' "${filePathForCommand}" 2>&1 | head -5 || echo "nodup"`,
                shouldUseProjectLocation ? projectLocation : undefined
              );
              const sameLineResult = sameLineDuplicateCheck.trim();
              
              if (!sameLineResult.includes('nodup') && sameLineResult.length > 0) {
                return {
                  success: false,
                  error: `Duplicate attribute detected: "${attrName}" appears multiple times on the same line. This likely means the file already had a "${attrName}" attribute and another one was added. Please search for the EXISTING attribute pattern (e.g., "${attrName}=\\"...\\"") and replace only that attribute value, not add a new one.`,
                  data: {
                    filePath: filePathForCheck,
                    output: outputTrimmed || 'Command executed but duplicate attribute created',
                    duplicateLines: sameLineResult,
                  },
                };
              }
            }
          }
          
          // Replacement succeeded
    return {
      success: true,
      data: {
        filePath: filePathForCheck,
        message: 'File edited successfully',
        output: outputTrimmed || 'Command executed',
      },
    };
        } else {
          // Search text still exists and replacement text doesn't - replacement failed
          return {
            success: false,
            error: `Search text "${searchText}" was not found in the file, so no replacement was made. Please verify the file content and search text.`,
            data: {
              filePath: filePathForCheck,
              output: outputTrimmed || 'Command executed but no replacement occurred',
            },
          };
        }
    } else {
      // Search text not found - check if replacement text exists (means it was already replaced or never existed)
      const safeReplaceForGrep2 = replaceText.replace(/'/g, "'\"'\"'"); // Escape single quotes in shell
      const checkReplaceCommand = `grep -Fq '${safeReplaceForGrep2}' "${filePathForCommand}" 2>&1 || echo "notfound"`;
      const checkReplaceOutput = await executeCommandOnServer(checkReplaceCommand, shouldUseProjectLocation ? projectLocation : undefined);
      const checkReplaceTrimmed = checkReplaceOutput.trim();
      
      if (!checkReplaceTrimmed.includes('notfound') && checkReplaceTrimmed.length > 0) {
        // Replacement text already exists - might have been replaced in a previous operation
        return {
          success: true,
          data: {
            filePath: filePathForCheck,
            message: 'File edited successfully (replacement text already present)',
            output: outputTrimmed || 'Command executed',
          },
        };
      } else {
        // Neither search nor replace text found - replacement couldn't happen
        return {
          success: false,
          error: `Search text "${searchText}" was not found in the file, so no replacement was made. Please verify the file content and search text match exactly.`,
          data: {
            filePath: filePathForCheck,
            output: outputTrimmed || 'Command executed but no replacement occurred',
          },
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get Gemini tool schema for execute command
 */
export function getExecuteCommandToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'execute_command',
        description: 'Execute any shell command on the server. Use this for commands like sed, echo, cat, ls, grep, find, or any other shell command. Be careful with destructive commands.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            command: {
              type: Type.STRING,
              description: 'The shell command to execute (e.g., "ls -la", "echo hello", "sed -i \'s/old/new/g\' file.txt")',
            },
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['command'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for echo
 */
export function getEchoToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'echo_command',
        description: 'Execute echo command to output text. Useful for debugging, creating files with echo, or testing.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'Text to echo',
            },
            options: {
              type: Type.OBJECT,
              properties: {
                noNewline: {
                  type: Type.BOOLEAN,
                  description: 'Do not print trailing newline (echo -n)',
                },
                enableEscape: {
                  type: Type.BOOLEAN,
                  description: 'Enable interpretation of backslash escapes (echo -e)',
                },
              },
              description: 'Optional echo options',
            } as any,
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['text'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for sed
 */
export function getSedToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'sed_command',
        description: 'Execute sed command for text transformation, search and replace, or stream editing. Use this for advanced text manipulation in files or text streams.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            script: {
              type: Type.STRING,
              description: 'Sed script/expression (e.g., "s/old/new/g", "1d" to delete first line, "/pattern/d" to delete lines matching pattern)',
            },
            filePath: {
              type: Type.STRING,
              description: 'Optional file path to apply sed to. If not provided, sed reads from stdin.',
            },
            options: {
              type: Type.OBJECT,
              properties: {
                inPlace: {
                  type: Type.BOOLEAN,
                  description: 'Edit file in-place (sed -i). Only works when filePath is provided.',
                },
                backup: {
                  type: Type.BOOLEAN,
                  description: 'Create backup file when editing in-place (sed -i.bak)',
                },
                extendedRegex: {
                  type: Type.BOOLEAN,
                  description: 'Use extended regular expressions (sed -E)',
                },
              },
              description: 'Optional sed options',
            } as any,
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['script'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for file read
 */
export function getReadFileToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'read_file',
        description: 'Read the contents of a file. Use this when you need to see what is in a file.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filePath: {
              type: Type.STRING,
              description: 'Path to the file to read (relative to project location if provided)',
            },
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['filePath'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for file write
 */
export function getWriteFileToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'write_file',
        description: 'Write content to a file (overwrites existing file). Use this to create or completely replace file contents.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filePath: {
              type: Type.STRING,
              description: 'Path to the file to write (relative to project location if provided)',
            },
            content: {
              type: Type.STRING,
              description: 'Content to write to the file',
            },
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['filePath', 'content'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for file append
 */
export function getAppendFileToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'append_file',
        description: 'Append content to the end of a file. Use this when you want to add content without overwriting existing content.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filePath: {
              type: Type.STRING,
              description: 'Path to the file to append to (relative to project location if provided)',
            },
            content: {
              type: Type.STRING,
              description: 'Content to append to the file',
            },
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['filePath', 'content'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for grep
 */
export function getGrepToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'grep_files',
        description: 'Search for a text pattern in files (like grep). Use this to find occurrences of text in files or code.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            pattern: {
              type: Type.STRING,
              description: 'Text pattern to search for (supports regex)',
            },
            filePath: {
              type: Type.STRING,
              description: 'Optional specific file or directory to search in. If not provided and recursive is true, searches current directory.',
            },
            options: {
              type: Type.OBJECT,
              properties: {
                caseSensitive: {
                  type: Type.BOOLEAN,
                  description: 'Whether search should be case-sensitive (default: false)',
                },
                recursive: {
                  type: Type.BOOLEAN,
                  description: 'Whether to search recursively in subdirectories (default: false)',
                },
                includeLineNumbers: {
                  type: Type.BOOLEAN,
                  description: 'Whether to include line numbers in results (default: false)',
                },
              },
              description: 'Optional grep options',
            } as any,
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['pattern'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for find
 */
export function getFindToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'find_files',
        description: 'Find files or directories by name pattern. Use this to locate files in the project.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            namePattern: {
              type: Type.STRING,
              description: 'Name pattern to search for (supports wildcards like *.ts, *test*)',
            },
            directory: {
              type: Type.STRING,
              description: 'Optional directory to search in (defaults to project location or current directory)',
            },
            options: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  enum: ['file', 'directory', 'both'],
                  description: 'Type of items to find (default: both)',
                },
                maxDepth: {
                  type: Type.NUMBER,
                  description: 'Maximum depth to search (default: unlimited)',
                },
              },
              description: 'Optional find options',
            } as any,
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['namePattern'],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for list directory
 */
export function getListDirectoryToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'list_directory',
        description: 'List files and directories in a directory (like ls). Use this to see what files exist in a directory.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            directory: {
              type: Type.STRING,
              description: 'Directory path to list (defaults to project location or current directory)',
            },
            options: {
              type: Type.OBJECT,
              properties: {
                showHidden: {
                  type: Type.BOOLEAN,
                  description: 'Whether to show hidden files (starting with .) (default: false)',
                },
                detailed: {
                  type: Type.BOOLEAN,
                  description: 'Whether to show detailed information (permissions, size, etc.) (default: false)',
                },
              },
              description: 'Optional listing options',
            } as any,
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: [],
        } as any,
      },
    ],
  };
}

/**
 * Get Gemini tool schema for edit file
 */
export function getEditFileToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'edit_file',
        description: 'Edit a file by replacing text (search and replace). Use this to modify file contents by replacing specific text.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filePath: {
              type: Type.STRING,
              description: 'Path to the file to edit (relative to project location if provided)',
            },
            searchText: {
              type: Type.STRING,
              description: 'Text to search for (will be replaced)',
            },
            replaceText: {
              type: Type.STRING,
              description: 'Text to replace with',
            },
            projectLocation: {
              type: Type.STRING,
              description: 'Optional project root directory. All commands will be executed within this directory.',
            },
          },
          required: ['filePath', 'searchText', 'replaceText'],
        } as any,
      },
    ],
  };
}

/**
 * Get all file system tool schemas
 */
export function getAllFileSystemToolSchemas(): GeminiToolSchema[] {
  return [
    getExecuteCommandToolSchema(),
    getEchoToolSchema(),
    getSedToolSchema(),
    getReadFileToolSchema(),
    getWriteFileToolSchema(),
    getAppendFileToolSchema(),
    getGrepToolSchema(),
    getFindToolSchema(),
    getListDirectoryToolSchema(),
    getEditFileToolSchema(),
  ];
}

