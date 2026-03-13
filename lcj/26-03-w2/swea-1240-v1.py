'''
1. 7자리 비트 암호 -> 정수 문자열로 변환
2. 올바른 암호인지 판단 -> len(idx) % 2 == 0 : *2, else : += int(str)
- 같은 for 문 안에서 수의 합 및 올바른 암호체계를 동시에 더해주기
3. 올바르다면 각 수의 합 출력
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

pwd_to_digit = {

    '0001101' : 0,
    '0110001' : 5,
    '0011001' : 1,
    '0101111' : 6,
    '0010011' : 2,
    '0111011' : 7,
    '0111101' : 3,
    '0110111' : 8,
    '0100011' : 4,
    '0001011' : 9
}


def find_code():

    for r in range(N):              # 1. 2차원 배열을 돌며 암호 찾기

        if '1' not in arr[r]:       # 패딩된 행은 skip
            continue

        for c in range(M):
            if arr[r][c] == '1':        # '1'로 시작하는 부분을 찾으면

                code = arr[r][c:c+56]   # (1) 우선 56자리 숫자열을 추출

                while code[-1] != '1':  # (2) 암호 마지막 부분이 1이 아닐 경우 -> 한자리씩 밀면서 올바른 암호 찾기

                    c -= 1
                    code = arr[r][c:c+56]

                result = interpret(arr[r][c:c+56])    # 2. 해독 시작

                return result       # 결과 리턴


def interpret(string):

    pwd_sum = 0
    pwd_check = 0

    for code_idx, idx in zip(range(0, 50, 7), range(1, 9)): # 1. 암호의 시작부분 code_idx, 암호 자리수 idx
        password_digit = pwd_to_digit[string[code_idx : code_idx + 7]]

        pwd_sum += password_digit           # 2. 암호 합산

        if idx % 2 != 0:                    # 3. 암호 검사 - 홀수 자리수는 2배, 짝수는 그대로 더함
            pwd_check += password_digit*3

        else:
            pwd_check += password_digit

    return pwd_sum if pwd_check % 10 == 0 else 0    # 4. 올바른 암호면 암호 합산값을, 아니면 0을 출력


for tc in range(1, T+1):

    N, M = map(int, input().split())

    arr = [input() for _ in range(N)]

    final = find_code()

    print(f"#{tc} {final}")