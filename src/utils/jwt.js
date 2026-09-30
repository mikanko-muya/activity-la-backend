// @ts-nocheck
import jwt from 'jsonwebtoken';
import {JWT_SECRET, JWT_REFRESH_SECRET} from '../config/globalkey.js';

export const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30m' }); // fixed from 30mn to 30m
}

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}