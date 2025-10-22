import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { MessageSquare } from 'lucide-react';

    const ChatModal = ({ rideId }) => {
      const navigate = useNavigate();

      const handleOpenChat = () => {
        navigate(`/chat/${rideId}`);
      };

      return (
        <div className="fixed bottom-24 right-4 z-20">
          <Button
            onClick={handleOpenChat}
            className="rounded-full h-16 w-16 bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-transform transform hover:scale-110"
          >
            <MessageSquare className="h-8 w-8" />
          </Button>
        </div>
      );
    };

    export default ChatModal;