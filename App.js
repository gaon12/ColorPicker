import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import tinycolor from 'tinycolor2';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'color_history';

// English-only strings
const STRINGS = {
  title: 'Color Converter',
  inputPlaceholder: 'Enter color (e.g. #3498db, red)',
  copy: 'Copied',
  copyHint: '(Tap to copy)',
  invalidColor: 'Invalid color value',
  recent: 'Recent Colors',
};

export default function App() {
  const colorScheme = useColorScheme();
  const [input, setInput] = useState('#3498db');
  const [formats, setFormats] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    const color = tinycolor(input);
    if (!color.isValid()) return;
    updateFormats(color);
  }, [input]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) { console.error('Failed to load history', e); }
  };

  const saveHistory = async (newHistory) => {
    try { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory)); }
    catch (e) { console.error('Failed to save history', e); }
  };

  const updateFormats = (color) => {
    const { r, g, b, a } = color.toRgb();
    const hsv = color.toHsv();
    const cmyk = rgbToCmyk(r, g, b);
    const result = {
      HEX: color.toHexString(),
      RGB: color.toRgbString(),
      RGBA: `rgba(${r}, ${g}, ${b}, ${a})`,
      HSL: color.toHslString(),
      HSV: `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s*100)}%, ${Math.round(hsv.v*100)}%)`,
      CMYK: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
    };
    setFormats(result);
    const hex = result.HEX;
    const newHistory = [hex, ...history.filter(c => c !== hex)].slice(0, 5);
    setHistory(newHistory);
    saveHistory(newHistory);
  };

  const rgbToCmyk = (r, g, b) => {
    let c = 1 - r/255, m = 1 - g/255, y = 1 - b/255;
    let k = Math.min(c, m, y);
    if (k===1) return { c:0,m:0,y:0,k:100 };
    return {
      c:Math.round(((c-k)/(1-k))*100),
      m:Math.round(((m-k)/(1-k))*100),
      y:Math.round(((y-k)/(1-k))*100),
      k:Math.round(k*100),
    };
  };

  const handleCopy = async (value) => {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert(STRINGS.copy, value);
    } catch { Alert.alert('Error', 'Clipboard failed.'); }
  };

  const handlePaste = async () => {
    try {
      const value = await Clipboard.getStringAsync();
      if (tinycolor(value).isValid()) setInput(value);
      else Alert.alert('⚠️', STRINGS.invalidColor);
    } catch { Alert.alert('Error', 'Clipboard access failed.'); }
  };

  return (
    <View style={{ flex:1, paddingTop:Platform.OS==='android'?30:50, paddingHorizontal:20, backgroundColor:colorScheme==='dark'?'#121212':'#f8f8f8' }}>
      <StatusBar style={colorScheme==='dark'?'light':'dark'} />
      <Text style={{ fontSize:24, fontWeight:'bold', marginBottom:10, color:colorScheme==='dark'?'#fff':'#000' }}>
        {STRINGS.title}
      </Text>

      <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={STRINGS.inputPlaceholder}
          placeholderTextColor="#888"
          style={{ flex:1, borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:10, color:colorScheme==='dark'?'#fff':'#000', backgroundColor:colorScheme==='dark'?'#1e1e1e':'#fff' }}
        />
        <TouchableOpacity onPress={handlePaste} style={{ marginLeft:8 }}>
          <Text style={{ fontSize:20 }}>📋</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height:40, borderRadius:10, marginBottom:15, backgroundColor:input }} />

      <ScrollView style={{ marginTop:15 }}>
        {Object.entries(formats).map(([k,v])=> (
          <TouchableOpacity key={k} onPress={()=>handleCopy(v)} style={{ paddingVertical:10, borderBottomWidth:1, borderBottomColor:'#ddd' }}>
            <Text style={{ fontSize:16, color:colorScheme==='dark'?'#fff':'#000' }}>{k}: {v}</Text>
            <Text style={{ fontSize:12, color:'#888' }}>{STRINGS.copyHint}</Text>
          </TouchableOpacity>
        ))}

        <Text style={{ fontSize:18, marginTop:20, fontWeight:'bold', color:colorScheme==='dark'?'#fff':'#000' }}>🎯 {STRINGS.recent}</Text>
        <View style={{ flexDirection:'row', flexWrap:'wrap', marginTop:10 }}>
          {history.map((hex,idx)=>(
            <TouchableOpacity key={idx} onPress={()=>setInput(hex)} style={{ backgroundColor:hex, width:40, height:40, borderRadius:8, margin:5, borderWidth:1, borderColor:'#888' }} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
