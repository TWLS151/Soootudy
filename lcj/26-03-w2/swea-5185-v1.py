'''
하나하나에 대해 이진수로 표현해서 뒤에 붙이자
'''
import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

def hex_to_bin(str):

    binary_num = ""

    for digit in str:

        decimal = int(digit, 16)    # 16진수를 10진수 정수로 변환

        binary_num += format(decimal, '04b')  # 변환된 정수 -> 2진수 문자열로

    return binary_num

for tc in range(1, T+1):

    N, hex_num = input().split() # 16진수 문자열 그대로 입력

    result = hex_to_bin(hex_num)

    print(f"#{tc} {result}")