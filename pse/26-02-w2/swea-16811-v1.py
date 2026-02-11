# swea.16811 <당근 포장하기>

T = int(input())

for tc in range(1, T+1):
    N = int(input())  # 당근 개수
    carrot = list(map(int, input().split()))    # 당근 크기 입력

    # 같은 크기의 당근은 같은 상자에 들어가야 하므로
    # 반드시 정렬 후 연속 구간으로 나눠야 함
    carrot.sort()

    # 최소 차이를 저장할 변수 무한대로 초기화
    min_num = float('inf')

    # 기준점 잡는 데에 시간을 오래 써서
    # AI의 힌트를 받아 기준점을 다시 생각해보았습니다 ... 운동많이된다..

    # i, j 두 개의 기준점 설정
    # 0 ~ i         → 소 상자
    # i+1 ~ j       → 중 상자
    # j+1 ~ N-1     → 대 상자

    for i in range(N-2):            # i는 0 ~ N-3 까지 가능
        for j in range(i+1, N-1):   # j는 i+1 ~ N-2 까지 가능

            # 조건 1: 같은 숫자를 경계에서 자르면 안 됨
            # (같은 크기의 당근은 반드시 같은 상자에 있어야 함)
            if carrot[i] == carrot[i+1] or carrot[j] == carrot[j+1]:
                continue

            # 각 상자에 들어갈 당근 개수 계산
            s_box = i + 1           # 0 ~ i  → 개수는 i+1
            m_box = j - i           # i+1 ~ j → j-i
            l_box = N - j - 1       # j+1 ~ N-1 → N-j-1

            # 조건 2: 한 상자에 N//2개 초과하면 안 됨
            if s_box > N//2 or m_box > N//2 or l_box > N//2:
                continue

            # 조건을 만족하는 경우: 상자 개수 차이 계산 -> (최대 - 최소)
            num = max(s_box, m_box, l_box) - min(s_box, m_box, l_box)
            min_num = min(min_num, num)     # 최소 차이 갱신

    # 만약 한 번도 유효한 분할이 없었다면
    # 포장 불가능 → -1 출력
    if min_num == float('inf'):
        print(f'#{tc} -1')
    else:
        print(f'#{tc} {min_num}')

'''
Docstring for sootudy.swea_16811
# swea.16811 당근 포장하기

# 조건
1. N개의 당근을 대/중/소 상자로 구분하기.
2. 같은 크기의 당근은 같은 상자에 있어야 함.
3. 빈 상자가 있으면 안됨.
4. 한 상자에 N//2개(N이 홀수면 소수점 버림)를 초과하면 안됨.
5. 위 조건을 만족하면서도, 
각 상자에 든 당근의 개수 차이가 "최소"가 되도록 포장해야 함!

그래서 구해야 하는 건?
- case 1: 포장할 수 없는 경우 -1 출력
- case 2: 포장할 수 있는 경우 -> 당근의 개수 차이가 최소일 때 차이값 출력하기

# 알고리즘 흐름
1. 정렬하기
2. i, j 두개의 기준점 잡아서
    0 ~ i
    i+1 ~ j
    j+1 ~ N-1
3. 조건 확인
4. (min-max) 계산
5. 최소값 갱신하기

'''