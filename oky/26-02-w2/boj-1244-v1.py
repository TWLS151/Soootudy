"""
==============================================
# 함수 활용한 버전
"""

def on_off(arr, *idx):
    # 전달받은 모든 인덱스들을 순회하며 처리
    for i in idx:
        if arr[i] == 0:
            arr[i] = 1
        else:
            arr[i] = 0
    return arr

N = int(input())
switch = list(map(int, input().split()))
K = int(input())
gender_num = [list(map(int, input().split())) for _ in range(K)]

for gender, num in gender_num:
    # 남학생
    if gender == 1:
        M = N // num

        # *[...] : 리스트 언패킹'
        # 여러 배수 인덱스들을 낱개로 풀어서 on_off 함수의 인자로 하나씩 전달
        on_off(switch, *[i * num - 1 for i in range(1, M + 1)])
    # 여학생
    if gender == 2:
        number = num - 1
        # 중심점 스위치 반전
        on_off(switch, number)
        j = 1
        # 리스트 범위를 벗어나지 않고 좌우 값이 같을 때까지 반복
        while (number - j >= 0 and number + j < N
               and switch[number - j] == switch[number + j]):
            # 대칭인 두 지점을 가변 인자로 전달하여 반전
            on_off(switch, number - j, number + j)
            j += 1

print(f'#{tc}')
for i in range(0, N, 20):
    print(*switch[i:i + 20])


"""
==============================================
# 함수 없이 바로 on/off한 버전
"""

N = int(input())
switch = list(map(int, input().split()))
K = int(input())
gender_num = [list(map(int, input().split())) for _ in range(K)]

for gender, num in gender_num:
    # 남학생
    if gender == 1:
        M = N // num

        for i in range(1, M + 1):
            switch[i * num - 1] = 1- switch[i * num - 1]

    # 여학생
    if gender == 2:
        number = num - 1
        # 중심점 스위치 반전
        switch[number] = 1 - switch[number]
        j = 1
        # 리스트 범위를 벗어나지 않고 좌우 값이 같을 때까지 반복
        while (number - j >= 0 and number + j < N
               and switch[number - j] == switch[number + j]):
            # 대칭인 두 지점을 가변 인자로 전달하여 반전
            switch[number - j] = switch[number + j] = 1 - switch[number - j]
            j += 1

print(f'#{tc}')
for i in range(0, N, 20):
    print(*switch[i:i + 20])
