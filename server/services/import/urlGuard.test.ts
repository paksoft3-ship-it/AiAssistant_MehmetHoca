import { describe, it, expect } from 'vitest';
import {
  parseImportUrl,
  isBlockedHostname,
  isPrivateAddress,
  isIpAddress,
  UrlImportError,
} from './urlGuard';

describe('parseImportUrl', () => {
  it('accepts public http(s) URLs', () => {
    expect(parseImportUrl('https://example.com/a').hostname).toBe('example.com');
    expect(parseImportUrl('http://example.com').protocol).toBe('http:');
  });

  it('rejects non-http(s) schemes', () => {
    expect(() => parseImportUrl('ftp://example.com')).toThrow(UrlImportError);
    expect(() => parseImportUrl('file:///etc/passwd')).toThrow(UrlImportError);
    expect(() => parseImportUrl('not a url')).toThrow(UrlImportError);
  });

  it('rejects localhost and internal hostnames up front', () => {
    expect(() => parseImportUrl('http://localhost:3000')).toThrow(UrlImportError);
    expect(() => parseImportUrl('http://service.internal')).toThrow(UrlImportError);
    expect(() => parseImportUrl('http://169.254.169.254/latest/meta-data')).toThrow(UrlImportError);
  });
});

describe('isBlockedHostname', () => {
  it('blocks localhost variants and metadata hosts', () => {
    expect(isBlockedHostname('localhost')).toBe(true);
    expect(isBlockedHostname('foo.localhost')).toBe(true);
    expect(isBlockedHostname('db.local')).toBe(true);
    expect(isBlockedHostname('metadata.google.internal')).toBe(true);
  });
  it('allows ordinary public hosts', () => {
    expect(isBlockedHostname('example.com')).toBe(false);
    expect(isBlockedHostname('arxiv.org')).toBe(false);
  });
});

describe('isPrivateAddress (IPv4)', () => {
  it('flags loopback / private / link-local / CGNAT ranges', () => {
    ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0']
      .forEach((ip) => expect(isPrivateAddress(ip)).toBe(true));
  });
  it('allows public IPv4', () => {
    ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1']
      .forEach((ip) => expect(isPrivateAddress(ip)).toBe(false));
  });
});

describe('isPrivateAddress (IPv6)', () => {
  it('flags loopback, unique-local, link-local, and IPv4-mapped private', () => {
    ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1']
      .forEach((ip) => expect(isPrivateAddress(ip)).toBe(true));
  });
  it('allows public IPv6 and mapped-public', () => {
    expect(isPrivateAddress('2606:4700:4700::1111')).toBe(false);
    expect(isPrivateAddress('::ffff:8.8.8.8')).toBe(false);
  });
});

describe('isIpAddress', () => {
  it('detects v4 and v6 literals', () => {
    expect(isIpAddress('1.2.3.4')).toBe(true);
    expect(isIpAddress('fe80::1')).toBe(true);
    expect(isIpAddress('example.com')).toBe(false);
  });
});
