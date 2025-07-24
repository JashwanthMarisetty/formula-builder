import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useForm } from '../contexts/FormContext';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi! How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const { chatbotSettings } = useForm();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: getBotResponse(inputMessage),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'I can help you with form building, field configuration, and troubleshooting. What specific issue are you facing?';
    } else if (lowerMessage.includes('form') || lowerMessage.includes('create')) {
      return 'To create a new form, click the "Create Form" button on your dashboard. You can then add fields by dragging them from the palette on the left.';
    } else if (lowerMessage.includes('field') || lowerMessage.includes('add')) {
      return 'You can add fields by selecting them from the Field Palette on the left side of the form builder. Each field can be customized in the Properties panel.';
    } else if (lowerMessage.includes('conditional') || lowerMessage.includes('logic')) {
      return 'Conditional logic allows you to show/hide fields or skip pages based on user responses. Click the branch icon in the form builder to set up conditions.';
    } else if (lowerMessage.includes('preview') || lowerMessage.includes('test')) {
      return 'You can preview your form by clicking the "Preview" button in the form builder. This shows how your form will look to users.';
    } else {
      return 'I understand you need help. Could you be more specific about what you\'re trying to do? I can assist with form creation, field configuration, conditional logic, and more.';
    }
  };

  if (!chatbotSettings.enabled) {
    return null;
  }

  return (
    <div className={`fixed z-50 ${
      chatbotSettings.position === 'bottom-right' ? 'bottom-4 right-4' :
      chatbotSettings.position === 'bottom-left' ? 'bottom-4 left-4' :
      'bottom-4 right-4'
    }`}>
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 h-96 flex flex-col">
          {/* Header */}
          <div className={`p-4 rounded-t-lg border-b border-gray-200 ${
            chatbotSettings.theme === 'purple' ? 'bg-purple-600' :
            chatbotSettings.theme === 'blue' ? 'bg-blue-600' :
            'bg-purple-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-white" />
                <h3 className="text-white font-medium">Formula Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs px-3 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform ${
            chatbotSettings.theme === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
            chatbotSettings.theme === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
            'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Chatbot;