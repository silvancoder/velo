/**
 * 科大讯飞翻译API - i18n批量翻译脚本
 * 
 * 示例: node src/locales/i18n-translate.js zh en
 * 
 * 需要在科大讯飞控制台获取：
 * - appid
 * - apiKey 
 * - apiSecret
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// 模拟CryptoJS (简化版)
import crypto from 'crypto';
const CryptoJS = {
    enc: {
        Base64: {
            stringify: (data) => data.toString('base64')
        },
        Utf8: {
            parse: (text) => Buffer.from(text, 'utf8')
        }
    },
    SHA256: (text) => crypto.createHash('sha256').update(text).digest(),
    HmacSHA256: (text, key) => crypto.createHmac('sha256', key).update(text).digest()
};

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 系统配置
const config = {
    // 请求地址
    hostUrl: "https://ntrans.xfyun.cn/v2/ots",
    host: "ntrans.xfyun.cn",
    // 在控制台-我的应用-机器翻译获取
    appid: "81f41c1a",
    // 在控制台-我的应用-机器翻译获取  
    apiSecret: "ODE3NmY3OWI5NmQzNzdiMmRjOTcwOTZm",
    // 在控制台-我的应用-机器翻译获取
    apiKey: "c92407dc33d412f316ab45f48028e61a",
    uri: "/v2/ots"
};

// 语言代码映射 (科大讯飞 API 格式)
const LANGUAGE_MAP = {
    'en': 'en',     // 英文
    'zh': 'cn',     // 中文
    'de': 'de',     // 德文  
    'fr': 'fr',     // 法文
    'es': 'es',     // 西班牙文
    'it': 'it',     // 意大利文
    'ja': 'ja',     // 日文
    'ko': 'ko',     // 韩文
    'pt': 'pt',     // 葡萄牙文
    'ru': 'ru'      // 俄文
};

// 从命令行参数获取语言参数
const [sourceLang, targetLang] = process.argv.slice(2);

if (!sourceLang || !targetLang) {
    console.error('用法: node i18n-translate.js <源语言> <目标语言>');
    console.error('');
    console.error('支持的语言: en, zh, de, fr, es, it, ja, ko, pt, ru');
    console.error('');
    console.error('示例:');
    console.error('node src/locales/i18n-translate.js zh de');
    console.error('node src/locales/i18n-translate.js zh fr');
    console.error('node src/locales/i18n-translate.js zh ja');
    console.error('node src/locales/i18n-translate.js zh ko');
    console.error('node src/locales/i18n-translate.js zh pt');
    console.error('node src/locales/i18n-translate.js zh ru');
    console.error('node src/locales/i18n-translate.js zh es');
    console.error('node src/locales/i18n-translate.js zh it');
    process.exit(1);
}

// 验证语言代码
if (!LANGUAGE_MAP[sourceLang] || !LANGUAGE_MAP[targetLang]) {
    console.error('❌ 不支持的语言代码');
    console.log('支持的语言:', Object.keys(LANGUAGE_MAP).join(', '));
    process.exit(1);
}

// 配置文件路径
const localesPath = path.join(__dirname, './');
const INPUT_FILE = path.join(localesPath, `${sourceLang}.json`);
const OUTPUT_FILE = path.join(localesPath, `${targetLang}.json`);

/**
 * 翻译单个文本
 */
async function translateText(text, from, to) {
    return new Promise((resolve, reject) => {
        // 跳过特殊字符串和插值
        if (!text ||
            text.includes('${') ||
            text.includes('{{') ||
            text.match(/^[0-9\s\-\.\:\/]+$/) ||
            text.length < 2) {
            resolve(text);
            return;
        }

        try {
            // 获取当前时间 RFC1123格式
            const date = new Date().toUTCString();
            const postBody = getPostBody(text, from, to);
            const digest = getDigest(postBody);

            const postData = JSON.stringify(postBody);
            const options = {
                hostname: config.host,
                path: config.uri,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json,version=1.0',
                    'Host': config.host,
                    'Date': date,
                    'Digest': digest,
                    'Authorization': getAuthStr(date, digest),
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const body = JSON.parse(data);

                        if (body.code !== 0) {
                            console.error(`翻译错误 [${text}]: ${body.message} (代码: ${body.code})`);
                            resolve(text); // 失败时返回原文
                            return;
                        }

                        if (body.data && body.data.result && body.data.result.trans_result) {
                            const translatedText = body.data.result.trans_result.dst;
                            console.log(`✓ 翻译: "${text}" → "${translatedText}"`);
                            resolve(translatedText);
                        } else {
                            console.error(`翻译响应格式异常 [${text}]:`, body);
                            resolve(text);
                        }
                    } catch (error) {
                        console.error(`解析翻译响应失败 [${text}]:`, error.message);
                        resolve(text);
                    }
                });
            });

            req.on('error', (error) => {
                console.error(`翻译请求失败 [${text}]:`, error.message);
                resolve(text);
            });

            req.write(postData);
            req.end();

        } catch (error) {
            console.error(`翻译过程出错 [${text}]:`, error.message);
            resolve(text);
        }
    });
}

/**
 * 递归翻译JSON对象
 */
async function translateObject(obj, from, to, path = '') {
    const result = {};
    const keys = Object.keys(obj);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        console.log(`📍 处理 (${i + 1}/${keys.length}): ${currentPath}`);

        if (typeof value === 'string') {
            // 翻译字符串
            result[key] = await translateText(value, from, to);

            // 添加延迟避免API频率限制
            await new Promise(resolve => setTimeout(resolve, 100));

        } else if (typeof value === 'object' && value !== null) {
            // 递归处理嵌套对象
            result[key] = await translateObject(value, from, to, currentPath);
        } else {
            // 其他类型保持不变
            result[key] = value;
        }
    }

    return result;
}

/**
 * 生成请求body
 */
function getPostBody(text, from, to) {
    return {
        common: {
            app_id: config.appid
        },
        business: {
            from: from,
            to: to
        },
        data: {
            text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text))
        }
    };
}

/**
 * 请求获取请求体签名
 */
function getDigest(body) {
    return 'SHA-256=' + CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(body)));
}

/**
 * 鉴权签名
 */
function getAuthStr(date, digest) {
    const signatureOrigin = `host: ${config.host}\ndate: ${date}\nPOST ${config.uri} HTTP/1.1\ndigest: ${digest}`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    return `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`;
}

/**
 * 统计需要翻译的字符串数量
 */
function countStringValues(obj) {
    let count = 0;

    function traverse(currentObj) {
        for (const key in currentObj) {
            if (typeof currentObj[key] === 'string') {
                count++;
            } else if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
                traverse(currentObj[key]);
            }
        }
    }

    traverse(obj);
    return count;
}

/**
 * 主函数
 */
async function main() {
    try {
        // 检查输入文件
        if (!fs.existsSync(INPUT_FILE)) {
            console.error(`❌ 源文件不存在: ${INPUT_FILE}`);
            process.exit(1);
        }

        console.log('🌍 科大讯飞 i18n 批量翻译工具');
        console.log('=====================================');
        console.log(`📁 源文件: ${INPUT_FILE}`);
        console.log(`📁 目标文件: ${OUTPUT_FILE}`);
        console.log(`🔄 翻译方向: ${sourceLang} → ${targetLang}`);
        console.log('');

        // 读取源JSON文件
        const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
        const sourceData = JSON.parse(rawData);

        const totalStrings = countStringValues(sourceData);
        console.log(`📊 待翻译字符串总数: ${totalStrings}`);
        console.log('');

        // 开始翻译
        console.log('🚀 开始翻译...');
        const translatedData = await translateObject(
            sourceData,
            LANGUAGE_MAP[sourceLang],
            LANGUAGE_MAP[targetLang]
        );

        // 保存结果
        const targetDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translatedData, null, 2), 'utf8');

        console.log('');
        console.log('✅ 翻译完成!');
        console.log(`📄 结果已保存到: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ 翻译过程出错:', error.message);
        process.exit(1);
    }
}

// 运行主函数
main().catch(console.error);
