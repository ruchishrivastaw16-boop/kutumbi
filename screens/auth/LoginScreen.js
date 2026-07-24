import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    SafeAreaView,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { login } from "../../api/authApi";
import { saveToken } from "../../api/storage/storage";
import { LinearGradient } from 'expo-linear-gradient';

const GRADIENT_COLORS = ['#4a90e2', '#6c5ce7']; // 45deg gradient
const GRADIENT_START = { x: 0, y: 1 }; // approximates CSS 45deg
const GRADIENT_END = { x: 1, y: 0 };

export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const getApiErrorMessage = (error) => {
        if (!error) return 'Login failed. Try again.';

        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        if (error.error) return error.error;
        if (error.errors) {
            if (typeof error.errors === 'string') return error.errors;
            if (Array.isArray(error.errors)) return error.errors.join('\n');
            if (typeof error.errors === 'object') return Object.values(error.errors).flat().join('\n');
        }
        if (error.status === 404) return 'User not found. Please check your email.';
        if (error.status === 401) return 'Invalid email or password. Please try again.';
        return 'Login failed. Please check your details and try again.';
    };

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');

        const trimmedEmail = email.trim();
        let hasError = false;

        if (!trimmedEmail) {
            setEmailError('Email is required.');
            hasError = true;
        }

        if (!password) {
            setPasswordError('Password is required.');
            hasError = true;
        }

        if (hasError) return;

        try {
            const response = await login(trimmedEmail, password);

            await saveToken(response.data.token);
            if (onLoginSuccess) {
                onLoginSuccess();
            }
            navigation.replace('HomeTabs');
        } catch (error) {
            Alert.alert('Login Error', getApiErrorMessage(error));
        }
    };

//    const handleLogin = () => {
//   navigation.replace('HomeTabs');
// };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>

                <View style={styles.logoWrapper}>
                    <Image
                        source={{ uri: 'https://kutumbi.com/company/assets/images/Knowe_Logo.png' }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <Text style={styles.title}>Learning Content</Text>
                <Text style={styles.subtitle}>Learning that meets you where you are .. and takes you where you can go..</Text>
<Text style={styles.title}>
    Welcome
</Text>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <LinearGradient
                            colors={focusedField === 'email' ? GRADIENT_COLORS : ['transparent', 'transparent']}
                            start={GRADIENT_START}
                            end={GRADIENT_END}
                            style={styles.inputGradientWrapper}>
                            <TextInput
                                style={[
                                    styles.input,
                                    focusedField === 'email' && styles.inputFocusedInner,
                                ]}
                                placeholder="Email"
                                placeholderTextColor="#A0A4AB"
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </LinearGradient>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <LinearGradient
                            colors={focusedField === 'password' ? GRADIENT_COLORS : ['transparent', 'transparent']}
                            start={GRADIENT_START}
                            end={GRADIENT_END}
                            style={styles.inputGradientWrapper}>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        focusedField === 'password' && styles.inputFocusedInner,
                                    ]}
                                    placeholder="Password"
                                    placeholderTextColor="#A0A4AB"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.showToggle}>
                                    <Text style={styles.showToggleText}>
                                        {showPassword ? 'Hide' : 'Show'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    </View>

                    <TouchableOpacity style={styles.forgotWrapper}>
                        <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.85} onPress={handleLogin}>
                        <LinearGradient
                            colors={GRADIENT_COLORS}
                            start={GRADIENT_START}
                            end={GRADIENT_END}
                            style={styles.loginButton}>
                            <Text style={styles.loginButtonText}>Log In</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                  
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 40,
    },
    logoWrapper: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 140,
        height: 70,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#1A1D21',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 32,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    inputGradientWrapper: {
        borderRadius: 10,
        padding: 1.5, // creates the gradient "border" thickness
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#E2E5EA',
        borderRadius: 9,
        paddingHorizontal: 14,
        fontSize: 15,
        color: '#1A1D21',
        backgroundColor: '#F9FAFB',
    },
    inputFocusedInner: {
        borderColor: '#F9FAFB', // hides the base border so only the gradient shows
    },
    passwordRow: {
        position: 'relative',
        justifyContent: 'center',
    },
    passwordInput: {
        paddingRight: 60,
    },
    showToggle: {
        position: 'absolute',
        right: 14,
    },
    showToggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B6EF6',
    },
    forgotWrapper: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        fontSize: 13,
        color: '#3B6EF6',
        fontWeight: '500',
    },
    loginButton: {
        height: 52,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
    },
});