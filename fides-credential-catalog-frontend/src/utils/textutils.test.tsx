import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { addNonVisibleHtmlBreaks } from './textutils';

test('renders learn react link', () => {

    expect(addNonVisibleHtmlBreaks("a".repeat(10))).toBe("a".repeat(10));
    expect(addNonVisibleHtmlBreaks("a".repeat(40))).toBe("a".repeat(30) + "&ZeroWidthSpace;" + "a".repeat(10));
    expect(addNonVisibleHtmlBreaks("a".repeat(80))).toBe("a".repeat(30) + "&ZeroWidthSpace;" + "a".repeat(30)+ "&ZeroWidthSpace;" + "a".repeat(20));
    expect(addNonVisibleHtmlBreaks("a".repeat(20) + " " + "a".repeat(60))).toBe("a".repeat(20) +" " + "a".repeat(30)+ "&ZeroWidthSpace;" + "a".repeat(30));
    expect(addNonVisibleHtmlBreaks("a".repeat(20) + " " + "a".repeat(20) + "Ab" + "a".repeat(20))).toBe("a".repeat(20) +" " + "a".repeat(20)+ "&ZeroWidthSpace;Ab" + "a".repeat(20));
});
