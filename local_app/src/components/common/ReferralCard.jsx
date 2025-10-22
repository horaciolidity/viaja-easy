import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Gift } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ReferralCard = () => {
    const { profile } = useAuth();
    const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "¡Enlace copiado!",
            description: "Ya puedes compartir tu enlace de invitación.",
        });
    };

    if (!profile?.referral_code) return null;

    return (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift /> ¡Invita y Gana!</CardTitle>
                <CardDescription className="text-white/80">Comparte este enlace con tus amigos y gana recompensas cuando se unan y viajen.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg">
                    <Input 
                        readOnly 
                        value={referralLink} 
                        className="bg-transparent border-none text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0" 
                    />
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="text-white hover:bg-white/30 shrink-0">
                        <Copy className="w-5 h-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReferralCard;