import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const VerificationSMS = () => {
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            phone: phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`,
        });

        setLoading(false);
        if (error) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Envoi du code...', description: 'Un code a été envoyé à votre téléphone.' });
            setStep(2);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setVerificationStatus(null);
        const { data, error } = await supabase.auth.verifyOtp({
            phone: phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`,
            token: code,
            type: 'sms'
        });

        setLoading(false);
        if (error) {
            setVerificationStatus('error');
            toast({ title: 'Erreur', description: "❌ Code invalide ou expiré.", variant: 'destructive' });
        } else {
            setVerificationStatus('success');
            toast({ title: 'Succès', description: '✅ Téléphone vérifié !' });
            setTimeout(() => {
                navigate('/compte');
            }, 2000);
        }
    };

    return (
        <>
            <Helmet>
                <title>Vérification par SMS - OneKamer.co</title>
            </Helmet>
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Vérification par téléphone</CardTitle>
                        <CardDescription>
                            {step === 1 ? 'Entrez votre numéro de téléphone pour recevoir un code de vérification.' : 'Entrez le code à 6 chiffres reçu par SMS.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {verificationStatus === 'success' ? (
                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4 text-green-700 py-8">
                                <CheckCircle className="h-12 w-12" />
                                <h2 className="text-xl font-bold">✅ Téléphone vérifié !</h2>
                                <p>Vous allez être redirigé...</p>
                            </motion.div>
                        ) : (
                            <>
                                {step === 1 ? (
                                    <form onSubmit={handleSendCode} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Numéro de téléphone</Label>
                                            <Input id="phone" type="tel" placeholder="+33 6 12 34 56 78" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Recevoir le code
                                        </Button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyCode} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Code de vérification</Label>
                                            <Input id="code" type="text" placeholder="123456" required value={code} onChange={(e) => setCode(e.target.value)} />
                                        </div>
                                        {verificationStatus === 'error' && (
                                            <div className="flex items-center gap-2 text-red-600 text-sm">
                                                <XCircle className="h-4 w-4" />
                                                <span>❌ Code invalide ou expiré.</span>
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Vérifier le code
                                        </Button>
                                    </form>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default VerificationSMS;