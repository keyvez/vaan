import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  breakdown?: {
    transliteration?: string;
    wordByWord?: string;
    grammar?: string;
  };
}

export function AICompanionPage() {
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'नमस्ते! Welcome to Sanskrit Saṃvāda. I am your AI companion for learning and practicing Sanskrit. Ask me anything!',
      breakdown: {
        transliteration: 'Namaste',
        wordByWord: 'namah (bow/salutation) + te (to you)',
        grammar: 'A respectful greeting combining reverence and acknowledgment'
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('practice');
  const [script, setScript] = useState('devanagari');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const response = generateMockResponse(input, mode);
      setMessages((prev) => [...prev, response]);
    }, 1000);

    setInput('');
  };

  const generateMockResponse = (userInput: string, currentMode: string): Message => {
    // Mock AI responses based on mode
    const responses: { [key: string]: Message } = {
      practice: {
        role: 'assistant',
        content: 'अहं सुखी अस्मि।',
        breakdown: {
          transliteration: 'ahaṃ sukhī asmi',
          wordByWord: 'ahaṃ (I) + sukhī (happy) + asmi (am)',
          grammar: 'Subject (ahaṃ) + Adjective (sukhī) + Verb (asmi). First person singular present tense.'
        }
      },
      story: {
        role: 'assistant',
        content: 'एकः सिंहः वने वसति स्म। सिंहः बलवान् आसीत्।',
        breakdown: {
          transliteration: 'ekaḥ siṃhaḥ vane vasati sma. siṃhaḥ balavān āsīt.',
          wordByWord: 'ekaḥ (one) + siṃhaḥ (lion) + vane (in forest) + vasati sma (used to live)',
          grammar: 'Past narrative tense (imperfect) describing a story setting'
        }
      },
      composition: {
        role: 'assistant',
        content: 'सत्येन धर्मं पालय।',
        breakdown: {
          transliteration: 'satyena dharmaṃ pālaya',
          wordByWord: 'satyena (by truth) + dharmaṃ (righteousness) + pālaya (protect/uphold)',
          grammar: 'Imperative mood - instrumental case + accusative + verb in command form'
        }
      }
    };

    return responses[currentMode] || responses.practice;
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-foreground mb-4">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="mb-4">{t('ai.title')}</h1>
          <p className="text-muted-foreground">
            {t('ai.subtitle')}
          </p>
        </div>

        {/* Sign Up Required - Show if not authenticated */}
        {!isAuthenticated ? (
          <Card className="p-8 md:p-12 border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Sign Up to Access AI Companion</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Sanskrit Saṃvāda is your personalized AI learning companion. Create a free account to unlock:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                <div>
                  <div className="font-semibold mb-2">💬 Interactive Conversations</div>
                  <p className="text-sm text-muted-foreground">Practice Sanskrit through natural dialogue with AI guidance</p>
                </div>
                <div>
                  <div className="font-semibold mb-2">📚 Grammar Breakdowns</div>
                  <p className="text-sm text-muted-foreground">Get detailed explanations of Sanskrit grammar and word structure</p>
                </div>
                <div>
                  <div className="font-semibold mb-2">💾 Conversation History</div>
                  <p className="text-sm text-muted-foreground">Save and review your learning journey over time</p>
                </div>
              </div>
              <Button
                onClick={login}
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                <User className="mr-2 h-5 w-5" />
                Sign Up Free with Google
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Takes less than 30 seconds • No credit card required
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">{t('ai.mode')}</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">{t('ai.practice')}</SelectItem>
                <SelectItem value="story">{t('ai.story')}</SelectItem>
                <SelectItem value="composition">{t('ai.composition')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm mb-2">{t('ai.script')}</label>
            <Select value={script} onValueChange={setScript}>
              <SelectTrigger className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devanagari">{t('ai.devanagari')}</SelectItem>
                <SelectItem value="roman">{t('ai.roman')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="h-[500px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 border border-foreground rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'border border-border'
                  } rounded-lg p-4`}
                >
                  <p className={message.role === 'user' ? 'text-lg' : 'text-xl mb-2'}>
                    {message.content}
                  </p>
                  
                  {message.breakdown && (
                    <div className="mt-3 pt-3 border-t border-border text-sm space-y-2">
                      {message.breakdown.transliteration && (
                        <div>
                          <span className="text-muted-foreground">Transliteration: </span>
                          <span className="italic">{message.breakdown.transliteration}</span>
                        </div>
                      )}
                      {message.breakdown.wordByWord && (
                        <div>
                          <span className="text-muted-foreground">Word by word: </span>
                          <span>{message.breakdown.wordByWord}</span>
                        </div>
                      )}
                      {message.breakdown.grammar && (
                        <div>
                          <span className="text-muted-foreground">Grammar: </span>
                          <span>{message.breakdown.grammar}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-8 h-8 border border-foreground rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ai.placeholder')}
                className="border-border"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

            {/* Info */}
            <div className="mt-8 p-6 border border-border rounded-lg">
              <h3 className="mb-4">About Sanskrit Saṃvāda</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="mb-2">Practice Mode</h4>
                  <p className="text-muted-foreground">
                    Learn conversational Sanskrit with prompts and corrections
                  </p>
                </div>
                <div>
                  <h4 className="mb-2">Story Mode</h4>
                  <p className="text-muted-foreground">
                    Build narratives and explore mythology sentence by sentence
                  </p>
                </div>
                <div>
                  <h4 className="mb-2">Composition Mode</h4>
                  <p className="text-muted-foreground">
                    Create prayers, poems, and slogans with proper grammar
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
