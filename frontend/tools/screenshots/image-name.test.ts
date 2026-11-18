// Tests for the screenshot command's image names, run by `npm run lint` through Node's own test runner.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appImageName, outsideImageName } from './image-name.ts';

describe('appImageName', () => {
  it('names the address, the sign-in state, the width, the theme and the language', () => {
    const name = appImageName({
      path: '/sign-in',
      signedIn: false,
      width: 360,
      theme: 'dark',
      language: 'ka',
    });

    assert.equal(name, 'sign-in--guest--0360-dark-ka.png');
  });

  it('names the home address "home"', () => {
    const name = appImageName({
      path: '/',
      signedIn: true,
      width: 1280,
      theme: 'light',
      language: 'en',
    });

    assert.equal(name, 'home--signed-in--1280-light-en.png');
  });

  it('turns the characters a Windows file name cannot hold into underscores', () => {
    const name = appImageName({
      path: '/admin/users?search=ana:b',
      signedIn: true,
      width: 768,
      theme: 'light',
      language: 'en',
    });

    assert.equal(name, 'admin_users_search=ana_b--signed-in--0768-light-en.png');
  });
});

describe('outsideImageName', () => {
  it('names the host, the path and the width, without the protocol', () => {
    const name = outsideImageName('https://www.example.com/about/team?lang=en', 360);

    assert.equal(name, 'www.example.com_about_team_lang=en--0360.png');
  });
});
