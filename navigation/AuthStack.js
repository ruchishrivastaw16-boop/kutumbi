import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import BottomTabs from './BottomTabs';
import ClassListScreen from '../screens/home/ClassListScreen';
import SubjectScreen from '../screens/home/SubjectScreen';
import ChapterScreen from '../screens/home/ChapterScreen';
import TopicScreen from '../screens/home/TopicScreen';
import ContentScreen from '../screens/home/ContentScreen';
import PlayerScreen from '../screens/home/PlayerScreen';
import Download from '../screens/home/Download';
import PerformanceScreen from '../screens/home/PerformanceScreen';
import { getToken } from '../api/storage/storage';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const bootstrapAuth = async () => {
            const token = await getToken();
            setIsLoggedIn(Boolean(token));
            setIsReady(true);
        };

        bootstrapAuth();
    }, []);

    if (!isReady) {
        return null;
    }

    return (
        <Stack.Navigator
            initialRouteName={isLoggedIn ? 'HomeTabs' : 'Login'}
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name="HomeTabs" component={BottomTabs} />
            <Stack.Screen name="ClassList" component={ClassListScreen} />
            <Stack.Screen name="SubjectList" component={SubjectScreen} />
            <Stack.Screen name="ChapterList" component={ChapterScreen} />
            <Stack.Screen name="TopicList" component={TopicScreen} />
            <Stack.Screen name="ContentList" component={ContentScreen} />
            <Stack.Screen name="PlayerScreen" component={PlayerScreen} />
            <Stack.Screen name="Download" component={Download} />
            <Stack.Screen name="Performance" component={PerformanceScreen} />
        </Stack.Navigator>
    );
}