import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { useToast } from '@/components/ui/use-toast';
    import { useNavigate, Link } from 'react-router-dom';
    import { Loader2 } from 'lucide-react';

    const AuthPage = () => {
      const { signIn, signUp } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const [loading, setLoading] = useState(false);

      const [loginEmail, setLoginEmail] = useState('');
      const [loginPassword, setLoginPassword] = useState('');

      const [registerEmail, setRegisterEmail] = useState('');
      const [registerPassword, setRegisterPassword] = useState('');
      const [registerUsername, setRegisterUsername] = useState('');

      const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signIn({ email: loginEmail, password: loginPassword });
        if (!error) {
          toast({ title: 'Connexion réussie !', description: 'Bienvenue à nouveau !' });
          navigate('/compte');
        }
        setLoading(false);
      };

      const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await signUp(
          { email: registerEmail, password: registerPassword },
          { 
            data: { username: registerUsername },
            emailRedirectTo: `${window.location.origin}/merci-verification` 
          }
        );
        if (!error) {
          toast({ title: 'Inscription réussie !', description: 'Veuillez vérifier votre e-mail pour confirmer votre compte.' });
        }
        setLoading(false);
      };

      return (
        <>
          <Helmet>
            <title>Connexion / Inscription - OneKamer.co</title>
            <meta name="description" content="Rejoignez la communauté OneKamer.co ou connectez-vous à votre compte." />
          </Helmet>
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Tabs defaultValue="login" className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Connexion</CardTitle>
                    <CardDescription>Accédez à votre compte pour continuer.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Mot de passe</Label>
                        <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Se connecter
                      </Button>
                      <div className="text-center text-sm">
                        <Link to="/verification-sms" className="underline">
                          Vérifier par SMS
                        </Link>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="register">
                <Card>
                  <CardHeader>
                    <CardTitle>Inscription</CardTitle>
                    <CardDescription>Créez un compte pour rejoindre la communauté.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-username">Nom d'utilisateur</Label>
                        <Input id="register-username" required value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input id="register-email" type="email" placeholder="m@example.com" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">Mot de passe</Label>
                        <Input id="register-password" type="password" required value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        S'inscrire
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </>
      );
    };

    export default AuthPage;